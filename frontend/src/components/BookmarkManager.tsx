import React, { useState, useEffect } from 'react';
import ChatFab from './ChatFab';

interface Bookmark {
  id: number;
  title: string;
  description: string;
  tags: string[];
  question_id?: number;
  message_id?: number;
  created_at: string;
}

interface BookmarkRequest {
  title: string;
  description: string;
  tags: string[];
  question_id?: number;
  message_id?: number;
}

interface BookmarkManagerProps {
  onClose?: () => void;
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({ onClose }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');

  const [newBookmark, setNewBookmark] = useState<BookmarkRequest>({
    title: '',
    description: '',
    tags: [],
    question_id: undefined,
    message_id: undefined
  });

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/personalization/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/personalization/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBookmark)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewBookmark({ title: '', description: '', tags: [] });
        fetchBookmarks();
      }
    } catch (error) {
      console.error('Error creating bookmark:', error);
    }
  };

  const deleteBookmark = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://127.0.0.1:8000/personalization/bookmarks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchBookmarks();
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !newBookmark.tags.includes(tag)) {
      setNewBookmark(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewBookmark(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || bookmark.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookmarks...</p>
          </div>
        </div>
      </div>
    );
  }

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📌 Bookmarks</h2>
            <p className="text-gray-600">Save and organize your favorite questions and explanations</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
            >
              + New Bookmark
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📌</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookmarks found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterTag ? 'Try adjusting your search or filter.' : 'Start by creating your first bookmark!'}
              </p>
              {!searchTerm && !filterTag && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Create First Bookmark
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookmarks.map(bookmark => (
                <div key={bookmark.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{bookmark.title}</h3>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="text-gray-600 mb-3">{bookmark.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {bookmark.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(bookmark.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Bookmark Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Bookmark</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bookmark title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newBookmark.description}
                    onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newBookmark.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedTags.join('')}
                      onChange={(e) => setSelectedTags([e.target.value])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add tags..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(selectedTags[0]);
                          setSelectedTags([]);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (selectedTags[0]) {
                          addTag(selectedTags[0]);
                          setSelectedTags([]);
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createBookmark}
                  disabled={!newBookmark.title}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  Create Bookmark
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat Icon - Fixed Position */}
      <ChatFab />
    </div>
  );
  }

  // Render as page (when no onClose prop)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background elements for consistency with chat */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-4xl mx-auto my-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* Title, Subtitle, and New Bookmark Button in one row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2 text-2xl">📌</span> My BookMark
              </h1>
              <p className="text-sm text-gray-600">Save and organize your favorite questions and explanations</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow"
            >
              + New Bookmark
            </button>
        </div>

          {/* Search and Filter in one row, no extra margin */}
          <div className="flex flex-col md:flex-row gap-2 mt-4">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
        </div>

        {/* Bookmarks List */}
          <div className="mt-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📌</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookmarks found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterTag ? 'Try adjusting your search or filter.' : 'Start by creating your first bookmark!'}
              </p>
              {!searchTerm && !filterTag && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Create First Bookmark
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBookmarks.map(bookmark => (
                <div key={bookmark.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{bookmark.title}</h3>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="text-gray-600 mb-3">{bookmark.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {bookmark.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(bookmark.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
      </div>

      {/* Create Bookmark Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Bookmark</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bookmark title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newBookmark.description}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newBookmark.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedTags.join('')}
                    onChange={(e) => setSelectedTags([e.target.value])}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add tags..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(selectedTags[0]);
                        setSelectedTags([]);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (selectedTags[0]) {
                        addTag(selectedTags[0]);
                        setSelectedTags([]);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createBookmark}
                disabled={!newBookmark.title}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                Create Bookmark
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatFab />
    </div>
  );
};

export default BookmarkManager; 