// migrate_proposals.js (placed in project root)
const mongoose = require('mongoose');
const path = require('path');

// Resolve dbConnect and models using absolute paths
const { dbConnect } = require(path.join(__dirname, 'lib', 'db', 'dbConnect'));
const { ProposalModel } = require(path.join(__dirname, 'lib', 'db', 'models'));

async function run() {
  await dbConnect();
  await ProposalModel.updateMany({}, {
    $set: {
      revisionNumber: 0,
      parentId: null,
      isActive: true,
      revisionComment: ''
    }
  });
  console.log('Migration completed: added revision fields with defaults');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
