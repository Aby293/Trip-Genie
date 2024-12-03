"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit, CheckCircle, XCircle, Plus } from 'lucide-react';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import DeleteConfirmation from "@/components/ui/deletionConfirmation";
import { AnimatePresence, motion } from "framer-motion";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [updatedCategory, setUpdatedCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("jwt");
      const response = await axios.get(
        "http://localhost:4000/admin/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast('Error fetching categories', 'error');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  const createCategory = async () => {
    if (newCategory) {
      try {
        const token = Cookies.get("jwt");
        await axios.post(
          "http://localhost:4000/admin/categories",
          { name: newCategory },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNewCategory("");
        showToast('Category created successfully!', 'success');
        fetchCategories();
      } catch (error) {
        showToast('This category already exists', 'error');
      }
    } else {
      showToast('Please enter a category name.', 'error');
    }
  };

  const handleUpdateCategory = async () => {
    if (updatedCategory) {
      try {
        const token = Cookies.get("jwt");
        await axios.put(
          `http://localhost:4000/admin/categories/${selectedCategoryId}`,
          { name: updatedCategory },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        showToast('Category updated successfully!', 'success');
        setSelectedCategoryId(null);
        setUpdatedCategory("");
        fetchCategories();
      } catch (error) {
        showToast('Category name already exists', 'error');
      }
    } else {
      showToast('Please enter a new category name.', 'error');
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      const token = Cookies.get("jwt");
      await axios.delete(
        `http://localhost:4000/admin/categories/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showToast('Category deleted successfully!', 'success');
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast('Error deleting category', 'error');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete._id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancel = () => {
    setNewCategory('');
  };

  return (
    <div className="min-h-screen p-8">
      <ToastProvider>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-[#1A3B47]">Create New Category</h2>
            <div className="flex space-x-4">
              <Input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                className="flex-grow bg-white text-[#1A3B47] border-[#B5D3D1]"
              />
              <Button 
                onClick={createCategory} 
                className="bg-[#1A3B47] hover:bg-[#1A3B47]/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#1A3B47]">Existing Categories</h2>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="animate-pulse bg-gray-100">
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-1/2 h-4 bg-gray-300 rounded" />
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-1/3 h-4 bg-gray-300 rounded" />
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-8 h-8 bg-gray-300 rounded-full" />
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-8 h-8 bg-gray-300 rounded-full" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.tbody
                      key="table-body"
                      className="bg-white divide-y divide-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {categories.map((category, index) => (
                        <motion.tr
                          key={category._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              onClick={() => {
                                setSelectedCategoryId(category._id);
                                setUpdatedCategory(category.name);
                              }}
                              className="p-2 bg-white text-[#1A3B47] hover:text-[#1A3B47]/70 hover:underline"
                              size="icon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              onClick={() => handleDeleteClick(category)}
                              className="p-2 bg-white text-red-600 hover:text-red-400 hover:underline"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </AnimatePresence>
                )}
              </table>
            </div>
          </div>
        </div>

        <DeleteConfirmation
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          itemType="category"
          onConfirm={handleConfirmDelete}
        />

        {selectedCategoryId && (
          <Dialog open={!!selectedCategoryId} onOpenChange={() => setSelectedCategoryId(null)}>
            <DialogContent className="sm:max-w-[500px] p-6 bg-white shadow-lg rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-[#1A3B47]">Edit Category</DialogTitle>
              </DialogHeader>
              <Input
                type="text"
                value={updatedCategory}
                onChange={(e) => setUpdatedCategory(e.target.value)}
                className="border-[#808080] mb-2"
              />
              <DialogFooter className="sm:justify-start">
                <Button
                  onClick={handleUpdateCategory}
                  className="bg-[#F88C33] hover:bg-orange-500 text-white"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setUpdatedCategory('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <ToastViewport className="fixed top-0 right-0 p-4" />
        {isToastOpen && (
          <Toast
            onOpenChange={setIsToastOpen}
            open={isToastOpen}
            className="bg-[#28A745] text-white p-4 mb-4 rounded-lg flex items-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            <ToastTitle>Success!</ToastTitle>
            <ToastDescription>{toastMessage}</ToastDescription>
            <ToastClose className="text-white ml-2">
              <XCircle className="h-5 w-5" />
            </ToastClose>
          </Toast>
        )}
      </ToastProvider>
    </div>
  );
}
