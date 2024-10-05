import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  ChevronLeft,
  Star,
  Edit,
  Trash2,
  Mail,
  Phone,
  Award,
  User,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
    <svg
      className="spinner"
      width="65px"
      height="65px"
      viewBox="0 0 66 66"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="path"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        cx="33"
        cy="33"
        r="30"
      ></circle>
    </svg>
  </div>
);

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(Cookies.get("role") || "guest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) {
        setError("Invalid product ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          `http://localhost:4000/${userRole}/products/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }

        const data = await response.json();
        setProduct(data);
        setError(null);
      } catch (err) {
        setError("Error fetching product details. Please try again later.");
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, userRole]);

  const handleUpdate = () => {
    navigate(`/update-product/${id}`);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    setDeleteError(null);
    try {
      const token = Cookies.get("jwt");
      const response = await fetch(
        `http://localhost:4000/${userRole}/products/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setDeleteError(errorData.message);
          return;
        }
        throw new Error("Failed to delete product");
      }

      setShowDeleteSuccess(true);
    } catch (err) {
      setError("Error deleting product. Please try again later.");
      console.error("Error deleting product:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">
                  {product.name}
                </CardTitle>
                <CardDescription className="flex items-center">
                  {product.rating ? (
                    <>
                      <StarRating rating={product.rating} />
                      <span className="ml-2 text-lg font-semibold">
                        {product.rating.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="ml-2 text-lg font-semibold">N/A</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img
                  src={product.picture}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                    <span className="text-2xl font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Package className="w-6 h-6 mr-2 text-blue-500" />
                    <span className="text-lg">
                      Quantity: {product.quantity}
                    </span>
                  </div>
                  <p className="text-gray-700">{product.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Traveler's Experiences
                </CardTitle>
                <CardDescription>
                  Here's some awesome feedback from our travelers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {product.reviews.map((review, index) => (
                    <div key={index} className="flex space-x-4">
                      <Avatar>
                        <AvatarFallback>{review.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold">
                            {review.user}
                          </h4>
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-gray-600 mt-1">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Seller Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={product.seller.avatar} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {product.seller.name}
                    </h3>
                    <Badge variant="secondary">Verified Seller</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-gray-500" />
                    <span>{product.seller.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-gray-500" />
                    <span>{product.seller.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-gray-500" />
                    <span>{product.seller.experience} years of experience</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              {(userRole === "admin" || userRole === "seller") && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleUpdate}
                >
                  <Edit className="w-4 h-4 mr-2" /> Update Product
                </Button>
              )}
              {userRole === "admin" && (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSuccess} onOpenChange={setShowDeleteSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <CheckCircle className="w-6 h-6 text-green-500 inline-block mr-2" />
              Product Deleted
            </DialogTitle>
            <DialogDescription>
              The product has been successfully deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => navigate("/all-products")}>
              Back to All Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteError !== null}
        onOpenChange={() => setDeleteError(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
              Failed to Delete Product
            </DialogTitle>
            <DialogDescription>{deleteError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setDeleteError(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
