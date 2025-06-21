const Category = require('../models/Category');
const Download = require('../models/Download');
const { validateCategory } = require('../utils/validators');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { includeStats = false } = req.query;
    
    let categories;
    
    if (includeStats === 'true') {
      // Get categories with download stats
      categories = await Category.getStats();
    } else {
      // Get basic category info
      categories = await Category.find({ isActive: true })
        .sort({ name: 1 })
        .lean();
    }
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories' 
    });
  }
};

// Create new category (admin only)
exports.createCategory = async (req, res) => {
  try {
    // Validate input
    const { error } = validateCategory(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const { 
      name, 
      description, 
      icon, 
      color, 
      autoMatch,
      isDefault 
    } = req.body;
    
    // Check if category with same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Category with this name already exists' 
      });
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await Category.updateMany(
        { isDefault: true },
        { isDefault: false }
      );
    }
    
    // Create category
    const category = new Category({
      name,
      description,
      icon,
      color,
      autoMatch,
      isDefault,
      createdBy: req.user._id
    });
    
    await category.save();
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('Category created', {
        userId: req.user._id,
        username: req.user.username,
        categoryId: category._id,
        categoryName: category.name
      });
    }
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create category' 
    });
  }
};

// Update category (admin only)
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Validate input
    const { error } = validateCategory(req.body, true); // true for partial validation
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }
    
    const updates = {};
    const allowedUpdates = [
      'name',
      'description',
      'icon',
      'color',
      'autoMatch',
      'isDefault',
      'isActive'
    ];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Check if updating name to existing one
    if (updates.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${updates.name}$`, 'i') },
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          error: 'Category with this name already exists' 
        });
      }
    }
    
    // If setting as default, unset other defaults
    if (updates.isDefault === true) {
      await Category.updateMany(
        { isDefault: true, _id: { $ne: categoryId } },
        { isDefault: false }
      );
    }
    
    // Update category
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('Category updated', {
        userId: req.user._id,
        username: req.user.username,
        categoryId: category._id,
        categoryName: category.name,
        updates: Object.keys(updates)
      });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to update category' 
    });
  }
};

// Delete category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }
    
    // Prevent deleting default categories
    if (category.isDefault) {
      return res.status(400).json({ 
        error: 'Cannot delete default category' 
      });
    }
    
    // Check if category has downloads
    const downloadCount = await Download.countDocuments({ category: categoryId });
    
    if (downloadCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${downloadCount} downloads. Please reassign downloads first.` 
      });
    }
    
    // Delete category
    await category.deleteOne();
    
    // Log activity
    const logger = req.app.get('logger');
    if (logger) {
      logger.info('Category deleted', {
        userId: req.user._id,
        username: req.user.username,
        categoryId: category._id,
        categoryName: category.name
      });
    }
    
    res.json({ 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      error: 'Failed to delete category' 
    });
  }
};

// Get category statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await Category.getStats();
    
    // Add additional aggregated stats
    const totalDownloads = stats.reduce((sum, cat) => sum + cat.downloadCount, 0);
    const totalSize = stats.reduce((sum, cat) => sum + cat.totalSize, 0);
    
    res.json({
      categories: stats,
      summary: {
        totalCategories: stats.length,
        totalDownloads,
        totalSize,
        averagePerCategory: totalDownloads > 0 ? Math.round(totalDownloads / stats.length) : 0
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category statistics' 
    });
  }
};

// Test auto-categorization
exports.testAutoCategory = async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ 
        error: 'Filename is required' 
      });
    }
    
    const category = await Category.autoDetectCategory(filename);
    
    res.json({
      filename,
      detectedCategory: category ? {
        id: category._id,
        name: category.name,
        slug: category.slug
      } : null,
      message: category ? 'Category detected' : 'No matching category found'
    });
  } catch (error) {
    console.error('Test auto-category error:', error);
    res.status(500).json({ 
      error: 'Failed to test auto-categorization' 
    });
  }
};