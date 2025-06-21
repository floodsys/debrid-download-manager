import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  FolderOpen,
  Download,
  HardDrive,
  TrendingUp,
  Settings,
  Plus
} from 'lucide-react';
import { categoriesAPI } from '../services/api';
import { formatSize } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';

export default function Categories() {
  const { isAdmin } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Fetch categories with stats
  const { data: categories, isLoading } = useQuery(
    ['categories', { includeStats: true }],
    () => categoriesAPI.getAll({ includeStats: true })
  );
  
  const { data: stats } = useQuery(
    'category-stats',
    categoriesAPI.getStats
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize your downloads by category
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        )}
      </div>
      
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Categories"
            value={stats.summary.totalCategories}
            icon={FolderOpen}
            color="blue"
          />
          <StatsCard
            title="Total Downloads"
            value={stats.summary.totalDownloads}
            icon={Download}
            color="green"
          />
          <StatsCard
            title="Total Size"
            value={formatSize(stats.summary.totalSize)}
            icon={HardDrive}
            color="purple"
          />
          <StatsCard
            title="Avg per Category"
            value={stats.summary.averagePerCategory}
            icon={TrendingUp}
            color="yellow"
          />
        </div>
      )}
      
      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      ) : categories?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard 
              key={category._id} 
              category={category}
              isAdmin={isAdmin()}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin() 
                ? 'Get started by creating a new category.' 
                : 'No categories have been created yet.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Card Component
function CategoryCard({ category, isAdmin }) {
  const [showEditModal, setShowEditModal] = useState(false);
  
  const getIconComponent = (iconName) => {
    // Map icon names to Lucide components
    const icons = {
      'folder': FolderOpen,
      'download': Download,
      'settings': Settings,
    };
    return icons[iconName] || FolderOpen;
  };
  
  const IconComponent = getIconComponent(category.icon);
  
  return (
    <>
      <div className="card hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: category.color + '20' }}
            >
              <IconComponent 
                className="w-6 h-6"
                style={{ color: category.color }}
              />
            </div>
            {category.isDefault && (
              <span className="badge badge-queued text-xs">Default</span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-sm text-gray-600 mb-4">
              {category.description}
            </p>
          )}
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Downloads:</span>
              <span className="font-medium">{category.downloadCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Size:</span>
              <span className="font-medium">
                {formatSize(category.totalSize || 0)}
              </span>
            </div>
          </div>
          
          {category.autoMatch?.enabled && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Auto-matching enabled</span>
                <br />
                {category.autoMatch.patterns?.length || 0} patterns configured
              </p>
            </div>
          )}
          
          {isAdmin && !category.isDefault && (
            <div className="mt-4 pt-4 border-t flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-secondary btn-sm flex-1"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit modal would go here */}
    </>
  );
}