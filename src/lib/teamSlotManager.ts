// Team slot management utility functions
import mongoose from 'mongoose';
import { ITeam } from '@/models/Team';

// Type definitions for slot operations
export interface SlotAssignmentOptions {
  assignedBy: mongoose.Types.ObjectId;
  assignedAt?: Date;
}

export interface LeaderTransferOptions extends SlotAssignmentOptions {
  newLeaderId: mongoose.Types.ObjectId;
}

export interface MemberTransferOptions extends SlotAssignmentOptions {
  userId: mongoose.Types.ObjectId;
  fromSlotId?: mongoose.Types.ObjectId;
  toSlotId?: mongoose.Types.ObjectId;
}

export class TeamSlotManager {
  
  // Get current team leader (works with both legacy and slot structure)
  static getCurrentLeader(team: ITeam): mongoose.Types.ObjectId | null {
    // Try slot-based structure first
    if (team.leaderSlot?.currentHolder) {
      return team.leaderSlot.currentHolder;
    }
    
    // Fallback to legacy structure
    if (team.teamLeaderId) {
      return team.teamLeaderId;
    }
    
    return null;
  }
  
  // Get current team members (works with both legacy and slot structure)
  static getCurrentMembers(team: ITeam): mongoose.Types.ObjectId[] {
    // Try slot-based structure first
    if (team.memberSlots && team.memberSlots.length > 0) {
      return team.memberSlots
        .filter(slot => {
          // Check if slot has a current holder
          if (!slot.currentHolder) return false;
          
          // Check history to make sure this assignment is still active
          if (slot.history && slot.history.length > 0) {
            // Find the latest assignment for the current holder
            const latestAssignment = slot.history
              .filter(entry => entry.userId.equals(slot.currentHolder!))
              .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
            
            // If there's a latest assignment and it doesn't have an unassignedAt date, it's active
            return latestAssignment && !latestAssignment.unassignedAt;
          }
          
          // If no history, assume active if currentHolder exists
          return true;
        })
        .map(slot => slot.currentHolder!);
    }
    
    // Fallback to legacy structure
    if (team.members && team.members.length > 0) {
      return team.members;
    }
    
    return [];
  }
  
  // Get all team members including leader
  static getAllTeamMembers(team: ITeam): mongoose.Types.ObjectId[] {
    const leader = this.getCurrentLeader(team);
    const members = this.getCurrentMembers(team);
    
    const allMembers = [...members];
    if (leader && !allMembers.some(id => id.equals(leader))) {
      allMembers.push(leader);
    }
    
    return allMembers;
  }
  
  // Check if user is team leader
  static isTeamLeader(team: ITeam, userId: mongoose.Types.ObjectId): boolean {
    const currentLeader = this.getCurrentLeader(team);
    return currentLeader ? currentLeader.equals(userId) : false;
  }
  
  // Check if user is team member
  static isTeamMember(team: ITeam, userId: mongoose.Types.ObjectId): boolean {
    const members = this.getCurrentMembers(team);
    return members.some(id => id.equals(userId));
  }
  
  // Check if user belongs to team (leader or member)
  static belongsToTeam(team: ITeam, userId: mongoose.Types.ObjectId): boolean {
    return this.isTeamLeader(team, userId) || this.isTeamMember(team, userId);
  }
  
  // Assign new team leader
  static assignLeader(team: ITeam, options: LeaderTransferOptions): void {
    const now = options.assignedAt || new Date();
    
    // Initialize leaderSlot if it doesn't exist
    if (!team.leaderSlot) {
      team.leaderSlot = { history: [] };
    }
    
    // Close current leader's assignment
    if (team.leaderSlot.currentHolder) {
      const currentEntry = team.leaderSlot.history.find(entry => 
        entry.userId.equals(team.leaderSlot!.currentHolder!) && !entry.unassignedAt
      );
      
      if (currentEntry) {
        currentEntry.unassignedAt = now;
      }
    }
    
    // Assign new leader
    team.leaderSlot.currentHolder = options.newLeaderId;
    team.leaderSlot.history.push({
      userId: options.newLeaderId,
      assignedAt: now,
      assignedBy: options.assignedBy
    });
    
    // Update legacy field for backwards compatibility
    team.teamLeaderId = options.newLeaderId;
  }
  
  // Remove team leader
  static removeLeader(team: ITeam, removedBy: mongoose.Types.ObjectId): void {
    const now = new Date();
    
    if (team.leaderSlot?.currentHolder) {
      // Close current leader's assignment
      const currentEntry = team.leaderSlot.history.find(entry => 
        entry.userId.equals(team.leaderSlot!.currentHolder!) && !entry.unassignedAt
      );
      
      if (currentEntry) {
        currentEntry.unassignedAt = now;
      }
      
      // Clear current holder
      team.leaderSlot.currentHolder = undefined;
    }
    
    // Clear legacy field
    team.teamLeaderId = undefined;
  }
  
  // Add member to team
  static addMember(team: ITeam, options: MemberTransferOptions): mongoose.Types.ObjectId {
    const now = options.assignedAt || new Date();
    
    // Initialize memberSlots if it doesn't exist
    if (!team.memberSlots) {
      team.memberSlots = [];
    }
    
    // Create new member slot
    const slotId = new mongoose.Types.ObjectId();
    const newSlot = {
      slotId,
      currentHolder: options.userId,
      history: [{
        userId: options.userId,
        assignedAt: now,
        assignedBy: options.assignedBy
      }]
    };
    
    team.memberSlots.push(newSlot);
    
    // Update legacy members array for backwards compatibility
    if (!team.members) {
      team.members = [];
    }
    
    if (!team.members.some(id => id.equals(options.userId))) {
      team.members.push(options.userId);
    }
    
    return slotId;
  }
  
  // Remove member from team
  static removeMember(team: ITeam, userId: mongoose.Types.ObjectId, removedBy: mongoose.Types.ObjectId): void {
    const now = new Date();
    
    // Find and close member slot
    if (team.memberSlots) {
      const memberSlot = team.memberSlots.find(slot => 
        slot.currentHolder && slot.currentHolder.equals(userId)
      );
      
      if (memberSlot) {
        // Close current assignment
        const currentEntry = memberSlot.history.find(entry => 
          entry.userId.equals(userId) && !entry.unassignedAt
        );
        
        if (currentEntry) {
          currentEntry.unassignedAt = now;
        }
        
        // Clear current holder
        memberSlot.currentHolder = undefined;
      }
    }
    
    // Update legacy members array
    if (team.members) {
      team.members = team.members.filter(id => !id.equals(userId));
    }
  }
  
  // Get leader history
  static getLeaderHistory(team: ITeam): Array<{
    userId: mongoose.Types.ObjectId;
    assignedAt: Date;
    unassignedAt?: Date;
    assignedBy: mongoose.Types.ObjectId;
    isCurrent: boolean;
  }> {
    if (!team.leaderSlot?.history) {
      return [];
    }
    
    return team.leaderSlot.history.map(entry => ({
      ...entry,
      isCurrent: !entry.unassignedAt
    }));
  }
  
  // Get member history for specific slot
  static getMemberSlotHistory(team: ITeam, slotId: mongoose.Types.ObjectId): Array<{
    userId: mongoose.Types.ObjectId;
    assignedAt: Date;
    unassignedAt?: Date;
    assignedBy: mongoose.Types.ObjectId;
    isCurrent: boolean;
  }> {
    if (!team.memberSlots) {
      return [];
    }
    
    const slot = team.memberSlots.find(s => s.slotId.equals(slotId));
    if (!slot) {
      return [];
    }
    
    return slot.history.map(entry => ({
      ...entry,
      isCurrent: !entry.unassignedAt
    }));
  }
  
  // Get complete team history (all positions)
  static getTeamHistory(team: ITeam): {
    leaders: Array<any>;
    memberSlots: Array<{ slotId: mongoose.Types.ObjectId; history: Array<any> }>;
  } {
    return {
      leaders: this.getLeaderHistory(team),
      memberSlots: team.memberSlots?.map(slot => ({
        slotId: slot.slotId,
        history: this.getMemberSlotHistory(team, slot.slotId)
      })) || []
    };
  }
}

export default TeamSlotManager;