#!/bin/bash
PROJECT_PATH="${1:-.}"
echo "Auditing project: $PROJECT_PATH"
node -e "
import { initializeCascadeSkills } from './dist/devin-integration/skills.js';
const skills = initializeCascadeSkills('$PROJECT_PATH');
skills.auditCodebase().then(console.log);
"
