import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Bell, LogOut } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { NotificationsDropdownAdmin } from '@/components/AdminNotificationsDropdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator"

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardContent } from "./DashboardContent";
import logo from "@/assets/images/TGlogo.svg";  

// Register all the chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// Reusable DashboardCard component
const DashboardCard = ({ title, value, subtitle, icon }) => (
  <Card className="bg-white border-[#B5D3D1] border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-[#1A3B47]">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-[#1A3B47]">{value}</div>
      <p className="text-xs text-[#388A94]">{subtitle}</p>
    </CardContent>
  </Card>
);

const tabs = [
  { id: 'dashboard', title: 'Dashboard', icon: 'Home' },
  { 
    id: 'accounts', 
    title: 'Accounts', 
    icon: 'Users',
    subItems: [
      { id: 'review-registration', title: 'Review Registration' },
      { id: 'manage-accounts', title: 'Manage Accounts' },
      { id: 'add-admin-governor', title: 'Add Admin/Governor' },
    ]
  },
  { id: 'complaints', title: 'Complaints', icon: 'MessageSquare' },
  { 
    id: 'giftshop', 
    title: 'Gift Shop', 
    icon: 'Gift',
    subItems: [
      { id: 'create-promo-code', title: 'Create Promo Code' },
      { id: 'manage-products', title: 'Manage Products' },
    ]
  },
  { 
    id: 'activities', 
    title: 'Activities', 
    icon: 'Activity',
    subItems: [
      { id: 'manage-categories', title: 'Manage Categories' },
      { id: 'manage-tags', title: 'Manage Tags' },
      { id: 'manage-activities', title: 'Manage Activities' }
    ]
  },
  { id: 'manage-itineraries', title: 'Manage Itineraries', icon: 'Map' },
  { 
    id: 'product', 
    title: 'Product', 
    icon: 'Gift',
    subItems: [
      { id: 'my-products', title: 'My Products' },
      { id: 'create-product', title: 'Create Product' },
      { id: 'archived-products', title: 'Archived Products' },
      { id: 'create-promo-code', title: 'Create Promo Code' },
      { id: 'manage-products', title: 'Manage Products' },
    ]
  },
  { id: 'historical-places', title: 'Historical Places', icon: 'Map' },
  { 
    id: 'reports', 
    title: 'Sales Reports', 
    icon: 'BarChart',
    subItems: [
      { id: 'itinerary-sales-report', title: 'Itineraries Report' },
      { id: 'activity-reports', title: 'Activities Report' },
      { id: 'my-product-sales-report', title: 'My Products Report'},
      { id: 'seller-product-sales-report', title: 'Seller\'s Products Report' },
      { id: 'user-stats', title: 'User Statistics' },
    ]
  },
];

const getInitials = (name) => {
  if (!name) return '';
  const initials = name.split(' ').map(word => word[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};

export function Dashboard() {
  const [hasUnseenNotificationsAdmin, setHasUnseenNotificationsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const checkUnseenNotificationsAdmin = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4000/admin/unseen-notifications`,
        {
          headers: { Authorization: `Bearer ${Cookies.get("jwt")}` },
        }
      );
      setHasUnseenNotificationsAdmin(response.data.hasUnseen);
    } catch (error) {
      console.error('Error checking unseen notifications:', error);
      // Silently fail but don't show the notification dot
      setHasUnseenNotificationsAdmin(false);
    }
  };

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = Cookies.get('jwt'); 
        const response = await axios.get('http://localhost:4000/admin/admin-info', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAdminInfo(response.data);
      } catch (error) {
        console.error('Error fetching admin info:', error);
      }
    };

    fetchAdminInfo();
    checkUnseenNotificationsAdmin();
  }, []);

  const handleToggleCollapse = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      const response = await fetch("http://localhost:4000/auth/logout");
      if (response.ok) {
        Cookies.remove("jwt");
        Cookies.remove("role");
        console.log("Logged out successfully");
        // Replace Next.js routing with a placeholder function
        window.location.href = "/login";
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div>
      <div className="text-[#1A3B47] p-2 border-b bg-gray-100 border-gray-300">
        <div className="flex justify-end items-center">
          {adminInfo && (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none group">
                <div className="flex items-center space-x-2 p-2 rounded-full transition-colors duration-200 group-hover:bg-[#B5D3D1]">
                  <span className="mr-2 text-[#1A3B47]">{adminInfo.username}</span>
                  <Avatar className="h-8 w-8 !bg-[#388A94] text-white" style={{ backgroundColor: '#388A94' }}>
                    <AvatarFallback className="bg-transparent">{getInitials(adminInfo.username)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg rounded-md p-2">
                <div className="flex items-center space-x-2 p-2">
                  <Avatar className="h-12 w-12 bg-[#388A94] text-white">
                    <AvatarFallback className="text-lg bg-transparet">{getInitials(adminInfo.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#1A3B47]">{adminInfo.username}</p>
                    <p className="text-sm text-[#5D9297]">Administrator</p>
                  </div>
                </div>
                {adminInfo.email && (
                      <p className="text-xs text-center mt-2 text-[#1A3B47]">{adminInfo.email}</p>
                    )}
                <Separator className="my-2" />
                <DropdownMenuItem 
                  className="w-full text-[#1A3B47] hover:bg-[#B5D3D1] transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <NotificationsDropdownAdmin />
        </div>
      </div>
      <div className="flex bg-gray-100">
        <DashboardSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onToggleCollapse={handleToggleCollapse} 
        />
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <main className="flex-1 overflow-y-auto transition-all duration-1000 ease-in-out transform">
            <DashboardContent activeTab={activeTab} tabs={tabs} setActiveTab={setActiveTab} />
          </main>
          <footer className="text-[#1A3B47] p-2 border-t border-gray-300">
            <div className="text-center">
              © {new Date().getFullYear()} Trip Genie. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

