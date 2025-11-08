// Central models registration to handle dependencies
// Import order matters to avoid schema registration errors

import User from './User';
import Team from './Team';
import Project from './Project';

export { User, Team, Project };