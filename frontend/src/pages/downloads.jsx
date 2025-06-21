import React, { useState } from 'react';
import { useQuery, useMutation,import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Download, 
  Filter, 
  Search,
  SortAsc,
  ChevronLeft,
  ChevronRight,
  Link2,
  FolderOpen
} from 'lucide-react';
import { downloadsAPI, categoriesAPI } from '../services/api';
import DownloadsList from '../components/DownloadsList';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/authStore';

export default function Downloads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Get filter params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentSort = searchParams.get('sort') || '-createdAt';
  
  // Queries
  const { data: categories } = useQuery('categories', categoriesAPI.getAll);
  
  const { data, isLoading, isFetching } = useQuery(
    ['downloads', { 
      page: currentPage, 
      category: currentCategory, 
      status: currentStatus,
      search,
      sort: currentSort,
      limit: 20
    }],
    () => downloadsAPI.getAll({
      page: currentPage,
      category: currentCategory,
      status: currentStatus,
      search,
      sort: currentSort,
      limit: 20
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Update URL params
  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };
  
  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search, page: '1' });
  };
  
  const handleFilterChange = (filterType, value) => {
    updateParams({ [filterType]: value, page: '1' });
  };
  
  const handlePageChange = (newPage) => {
    updateParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Download className="w-5 h-5 mr-2" />
          Add Download
        </button>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search downloads..."
                  className="form-input pl-10 pr-4"
                />
              </div>
            </form>
            
            {/* Category filter */}
            <select
              value={currentCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-input"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            {/* Status filter */}
            <select
              value={currentStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="queued">Queued</option>
              <option value="downloading">Downloading</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          
          {/* Sort options */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={currentSort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="form-input py-1 text-sm"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="-completedAt">Recently Completed</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-size">Largest First</option>
              <option value="size">Smallest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      {data && (
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, data.pagination.total)} of {data.pagination.total} downloads
        </div>
      )}
      
      {/* Downloads list */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading downloads...</p>
              </div>
            </div>
          ) : data?.downloads?.length > 0 ? (
            <DownloadsList downloads={data.downloads} />
          ) : (
            <div className="text-center py-12">
              <Download className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No downloads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {search || currentCategory || currentStatus 
                  ? 'Try adjusting your filters' 
                  : 'Add your first download to get started'}
              </p>
              {(search || currentCategory || currentStatus) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSearchParams({});
                  }}
                  className="mt-4 btn btn-secondary btn-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isFetching}
            className="btn btn-secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {data.pagination.pages}
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === data.pagination.pages || isFetching}
            className="btn btn-secondary"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
      
      {/* Add Download Modal */}
      <AddDownloadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />
    </div>
  );
}

// Add Download Modal Component
function AddDownloadModal({ isOpen, onClose, categories }) {
  const queryClient = useQueryClient();
  const { canDownload, getRemainingDownloads } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm();

  const addMutation = useMutation(downloadsAPI.add, {
    onSuccess: () => {
      queryClient.invalidateQueries(['downloads']);
      queryClient.invalidateQueries(['download-stats']);
      toast.success('Download added successfully');
      reset();
      onClose();
    },
  });

  const onSubmit = (data) => {
    if (!canDownload()) {
      toast.error('Download quota exceeded for today');
      return;
    }
    
    addMutation.mutate(data);
  };

  const remainingDownloads = getRemainingDownloads();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Download"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {remainingDownloads !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              You have <span className="font-semibold">{remainingDownloads}</span> downloads remaining today
            </p>
          </div>
        )}
        
        <div>
          <label htmlFor="magnetLink" className="form-label">
            Magnet Link
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              {...register('magnetLink', {
                required: 'Magnet link is required',
                pattern: {
                  value: /^magnet:\?xt=urn:btih:[a-fA-F0-9]/,
                  message: 'Invalid magnet link format'
                }
              })}
              className="form-input pl-10 font-mono text-sm"
              rows="3"
              placeholder="magnet:?xt=urn:btih:..."
            />
          </div>
          {errors.magnetLink && (
            <p className="form-error">{errors.magnetLink.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="form-label">
            Category (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FolderOpen className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('categoryId')}
              className="form-input pl-10"
            >
              <option value="">Auto-detect category</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canDownload()}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Adding...' : 'Add Download'}
          </button>
        </div>
      </form>
    </Modal>
  );
}