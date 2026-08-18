// scripts/migrate_proposals.js
const mongoose = require('mongoose');
const { dbConnect } = require('../lib/db/dbConnect');
const { Proposal } = require('../lib/db/models');

async function run() {
  await dbConnect();
  await Proposal.updateMany({}, {
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
