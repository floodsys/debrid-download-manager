require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const defaultCategories = [
  {
    name: 'Movies',
    description: 'Films, movies, and cinema',
    icon: 'film',
    color: '#e74c3c',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        '1080p',
        '720p',
        '2160p',
        '4k',
        'bluray',
        'brrip',
        'dvdrip',
        'webrip',
        'hdtv',
        'hdrip',
        '\\.mkv$',
        '\\.mp4$',
        '\\.avi$',
        'x264',
        'x265',
        'hevc'
      ],
      priority: 10
    }
  },
  {
    name: 'TV Shows',
    description: 'Television series and episodes',
    icon: 'tv',
    color: '#3498db',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        's\\d{2}e\\d{2}',
        's\\d{2}',
        'season\\.?\\d+',
        'episode\\.?\\d+',
        '\\dx\\d{2}',
        'complete\\.series',
        'complete\\.season',
        'hdtv',
        'web-dl',
        'webdl'
      ],
      priority: 9
    }
  },
  {
    name: 'Music',
    description: 'Audio files, albums, and soundtracks',
    icon: 'music',
    color: '#9b59b6',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        '\\.mp3$',
        '\\.flac$',
        '\\.wav$',
        '\\.m4a$',
        '\\.aac$',
        '\\.ogg$',
        '\\.wma$',
        '\\.opus$',
        'album',
        'discography',
        'soundtrack',
        'ost',
        '\\[320\\]',
        '\\[flac\\]',
        'lossless'
      ],
      priority: 8
    }
  },
  {
    name: 'Games',
    description: 'Video games and gaming content',
    icon: 'gamepad',
    color: '#2ecc71',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        'codex',
        'reloaded',
        'skidrow',
        'plaza',
        'cpy',
        'repack',
        'fitgirl',
        'dodi',
        'goty',
        'game\\.of\\.the\\.year',
        'update',
        'dlc',
        '\\.iso$',
        'rip',
        'gog',
        'steam'
      ],
      priority: 7
    }
  },
  {
    name: 'Software',
    description: 'Applications, programs, and utilities',
    icon: 'cpu',
    color: '#f39c12',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        '\\.exe$',
        '\\.msi$',
        '\\.dmg$',
        '\\.pkg$',
        '\\.deb$',
        '\\.rpm$',
        '\\.appimage$',
        'setup',
        'installer',
        'portable',
        'crack',
        'patch',
        'keygen',
        'license',
        'activated',
        'pre-activated'
      ],
      priority: 6
    }
  },
  {
    name: 'Documents',
    description: 'Books, PDFs, and text files',
    icon: 'file-text',
    color: '#16a085',
    isDefault: true,
    autoMatch: {
      enabled: true,
      patterns: [
        '\\.pdf$',
        '\\.epub$',
        '\\.mobi$',
        '\\.azw3$',
        '\\.djvu$',
        '\\.doc$',
        '\\.docx$',
        '\\.txt$',
        'ebook',
        'book',
        'manual',
        'guide',
        'tutorial'
      ],
      priority: 5
    }
  },
  {
    name: 'Other',
    description: 'Miscellaneous downloads',
    icon: 'folder',
    color: '#95a5a6',
    isDefault: true,
    autoMatch: {
      enabled: false,
      patterns: [],
      priority: 0
    }
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realdebrid-manager', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB\n');
    console.log('🌱 Seeding Categories');
    console.log('====================\n');
    
    let created = 0;
    let skipped = 0;
    let updated = 0;
    
    for (const categoryData of defaultCategories) {
      try {
        // Check if category exists by slug
        const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-');
        const existingCategory = await Category.findOne({ slug });
        
        if (existingCategory) {
          // Update existing category with new patterns if it's a default category
          if (existingCategory.isDefault) {
            existingCategory.autoMatch = categoryData.autoMatch;
            existingCategory.description = categoryData.description;
            existingCategory.color = categoryData.color;
            existingCategory.icon = categoryData.icon;
            await existingCategory.save();
            console.log(`📝 Updated: ${categoryData.name}`);
            updated++;
          } else {
            console.log(`⏭️  Skipped: ${categoryData.name} (already exists)`);
            skipped++;
          }
        } else {
          // Create new category
          await Category.create(categoryData);
          console.log(`✅ Created: ${categoryData.name}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Error with category ${categoryData.name}:`, error.message);
      }
    }
    
    // Set default category if none exists
    const defaultCategory = await Category.findOne({ isDefault: true });
    if (!defaultCategory) {
      const otherCategory = await Category.findOne({ slug: 'other' });
      if (otherCategory) {
        otherCategory.isDefault = true;
        await otherCategory.save();
        console.log('\n✅ Set "Other" as default category');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`✅ Created: ${created}`);
    console.log(`📝 Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log('\n✨ Categories seeded successfully!');
    
  } catch (error) {
    console.error('\n❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n\nOperation cancelled.');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
console.log('🚀 Real-Debrid Manager - Category Seeder');
console.log('========================================\n');

seedCategories();