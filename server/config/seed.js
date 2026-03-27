require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const User = require('../models/User');
const Charity = require('../models/Charity');

const charities = [
  {
    name: 'St. Jude Children\'s Research Hospital',
    description: 'Leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.',
    image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400'
  },
  {
    name: 'Doctors Without Borders',
    description: 'International humanitarian medical organization providing aid in crisis situations worldwide.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'
  },
  {
    name: 'World Wildlife Fund',
    description: 'Conserving nature and reducing the most pressing threats to the diversity of life on Earth.',
    image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400'
  },
  {
    name: 'Feeding America',
    description: 'The nation\'s largest domestic hunger-relief organization, mobilizing millions of pounds of food.',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400'
  },
  {
    name: 'Red Cross',
    description: 'Preventing and alleviating human suffering in the face of emergencies worldwide.',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400'
  }
];

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Charity.deleteMany({});
    await User.deleteOne({ email: 'admin@golfcharity.com' });

    // Seed charities
    const createdCharities = await Charity.insertMany(charities);
    console.log(`✅ Seeded ${createdCharities.length} charities`);

    // Seed admin user
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);
    await User.create({
      name: 'Admin User',
      email: 'admin@golfcharity.com',
      password: hashedPassword,
      role: 'admin',
      subscription_status: 'active',
      plan: 'yearly'
    });
    console.log('✅ Admin user created: admin@golfcharity.com / Admin@1234');

    console.log('🌱 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
