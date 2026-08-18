import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Package from '../models/Package.js';
import Project from '../models/Project.js';
import Content from '../models/Content.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blackleafwebstudio_db_user:password@cluster0.nimpnyw.mongodb.net/blackleaf';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Seed Packages
    const countPackages = await Package.countDocuments();
    if (countPackages === 0) {
      console.log('Seeding default packages...');
      const defaultPackages = [
        {
          _id: '1',
          name: 'Starter Web',
          price: '$249',
          img: '',
          features: ['1 Page brutalist design', '1 week delivery', 'Responsive design', 'Contact form', 'Clean code'],
        },
        {
          _id: '2',
          name: 'Growth Pack',
          price: '$499',
          img: '',
          features: ['Up to 5 pages', 'Custom assets', 'SEO optimization', '1.5 weeks delivery', 'Google Maps integration'],
        },
        {
          _id: '3',
          name: 'Creative Elite',
          price: '$999',
          img: '',
          features: ['Unlimited pages', 'Custom branding', 'Advanced animations', 'CMS database support', 'Priority hosting setup'],
        },
      ];
      await Package.insertMany(defaultPackages);
      console.log('Packages seeded successfully.');
    } else {
      console.log('Packages already exist. Skipping package seeding.');
    }

    // Seed Projects
    const countProjects = await Project.countDocuments();
    if (countProjects === 0) {
      console.log('Seeding default projects...');
      const defaultProjects = [
        {
          title: 'Creative Studio',
          desc: 'A gorgeous portal for digital creatives.',
          link: 'https://jitsmp.great-site.net/',
          img: '',
        },
        {
          title: 'Vercel Deployment',
          desc: 'Automated preview showing vercel magic.',
          link: 'https://nextjs-vercel-boilerplate.vercel.app',
          img: '',
        },
        {
          title: 'Retro Shop',
          desc: 'A hand-coded E-commerce catalog.',
          link: 'https://google.com',
          img: '',
        },
      ];
      await Project.insertMany(defaultProjects);
      console.log('Projects seeded successfully.');
    } else {
      console.log('Projects already exist. Skipping project seeding.');
    }

    // Seed Hero Content
    const heroContent = await Content.findOne({ $or: [{ key: 'hero' }, { _id: 'hero' }] });
    if (!heroContent) {
      console.log('Seeding default hero content...');
      await Content.create({
        _id: 'hero',
        key: 'hero',
        priceTag: 'Starting at $249',
        title: 'WE BUILD<br>YOUR WEB.',
        desc: 'Professional, organic, and hand-coded websites for your business. Ready to launch in 1 week.',
        img: '/images/software-developer-g1372d020e_1280.jpg',
      });
      console.log('Hero content seeded successfully.');
    } else {
      console.log('Hero content already exists. Skipping hero content seeding.');
    }

    console.log('Database seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedData();
