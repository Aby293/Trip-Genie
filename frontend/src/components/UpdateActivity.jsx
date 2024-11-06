import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Check, X } from "lucide-react";
import * as z from "zod";
import axios from "axios";
import Cookies from "js-cookie";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
import { set } from "date-fns";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    coordinates: z.object({
      longitude: z.number(),
      latitude: z.number(),
    }),
  }),
  duration: z.number().int().positive("Duration must be a positive integer"),
  timing: z.date().refine((date) => date > new Date(), {
    message: "Timing must be a future date",
  }),
  price: z.number().int().positive("Price must be a positive integer"),
  currency: z.string().min(1, "Please select a currency"),
  category: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nonempty("At least one category is required"),
  tags: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .nonempty("At least one tag is required"),
  specialDiscount: z
    .number()
    .int()
    .nonnegative("Discount must be a non-negative integer"),
  isBookingOpen: z.boolean(),
});

export default function UpdateActivity() {
  const { id } = useParams();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      location: {
        address: "",
        coordinates: { longitude: 0, latitude: 0 },
      },
      duration: 0,
      timing: new Date(),
      price: 0,
      category: [],
      tags: [],
      specialDiscount: 0,
      isBookingOpen: true,
    },
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 29.9792, lng: 31.1342 });
  const [markerPosition, setMarkerPosition] = useState({
    lat: 29.9792,
    lng: 31.1342,
  });
  const [currencies, setCurrencies] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [newPictures, setNewPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const role = Cookies.get("role") || "guest";

        const [activityResponse, categoriesResponse, tagsResponse] =
          await Promise.all([
            axios.get(`http://localhost:4000/${role}/activities/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("http://localhost:4000/api/getAllCategories"),
            axios.get("http://localhost:4000/api/getAllTags"),
          ]);

        const activityData = activityResponse.data;
        setCategories(
          categoriesResponse.data.map((cat) => ({
            value: cat._id,
            label: cat.name,
          }))
        );
        setTags(
          tagsResponse.data.map((tag) => ({ value: tag._id, label: tag.type }))
        );

        console.log("Activity data:", activityData);
        // Set form values
        setValue("name", activityData.name);
        setValue("description", activityData.description);
        setValue("location.address", activityData.location.address);
        setValue("duration", activityData.duration);
        setValue("timing", new Date(activityData.timing));
        setValue("price", activityData.price);
        setValue("currency", activityData.currency);
        setValue("specialDiscount", activityData.specialDiscount);
        setValue("isBookingOpen", activityData.isBookingOpen);
        setValue("pictures", activityData.pictures);

        setPictures(activityData.pictures);
        // Set location for the map
        const activityLocation = activityData.location.coordinates;
        setMapCenter({
          lat: activityLocation.latitude,
          lng: activityLocation.longitude,
        });
        setMarkerPosition({
          lat: activityLocation.latitude,
          lng: activityLocation.longitude,
        });
        setValue("location.coordinates", {
          latitude: activityLocation.latitude,
          longitude: activityLocation.longitude,
        });

        // Set categories and tags
        setValue(
          "category",
          activityData.category.map((cat) => ({
            value: cat._id,
            label: cat.name,
          }))
        );
        setValue(
          "tags",
          activityData.tags.map((tag) => ({ value: tag._id, label: tag.type }))
        );
      } catch (error) {
        console.error("Failed to fetch activity data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrencies();
    fetchData();
  }, [id, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    const token = Cookies.get("jwt");
    const role = Cookies.get("role") || "guest";

    // Create a FormData instance to handle file uploads along with other data
    const formData = new FormData();

    // Append fields to FormData, keeping the existing logic
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("timing", data.timing);
    formData.append("duration", Number(data.duration));
    formData.append("price", Number(data.price));
    formData.append("specialDiscount", Number(data.specialDiscount));
    formData.append("isBookingOpen", data.isBookingOpen);
    formData.append("currency", data.currency);

    // Append location details
    formData.append("location[address]", data.location.address);
    formData.append(
      "location[coordinates][latitude]",
      data.location.coordinates.latitude
    );
    formData.append(
      "location[coordinates][longitude]",
      data.location.coordinates.longitude
    );

    // Append category and tags arrays
    data.category.forEach((cat) => formData.append("category[]", cat.value));
    data.tags.forEach((tag) => formData.append("tags[]", tag.value));

    // Append old pictures (if any) as JSON array
    formData.append("oldPictures", JSON.stringify(pictures || []));

    // Append new pictures as binary files
    newPictures.forEach((picture) => {
      formData.append("newPictures", picture);
    });

    try {
      console.log("Location coordinates:", data.location.coordinates);
      const response = await axios.put(
        `http://localhost:4000/${role}/activities/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Updated activity:", response.data);
      setShowDialog(true);
    } catch (error) {
      console.error("Failed to update activity:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const MapComponent = () => {
    const map = useMap();

    useEffect(() => {
      map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());
    }, [map, mapCenter, markerPosition]);

    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPosition({ lat, lng }); // Update the marker position state
        setValue("location.coordinates", { latitude: lat, longitude: lng }); // Update the form's coordinates state
      },
    });

    return <Marker position={[markerPosition.lat, markerPosition.lng]} />;
  };

  const fetchCurrencies = async () => {
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/advertiser/currencies`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrencies(response.data);
    } catch (err) {
      console.error("Error fetching currencies:", err.message);
      setError("Failed to fetch currencies. Please try again.");
    }
  };

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newFilePictures = Array.from(files);

      // Create a Set to avoid duplicates based on file names
      const existingFileNames = new Set(newPictures.map((file) => file.name));

      const newFilesToUpload = newFilePictures.filter(
        (file) => !existingFileNames.has(file.name)
      );

      const newBase64PicturesPromises = newFilesToUpload.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => resolve(reader.result);
          })
      );

      Promise.all(newBase64PicturesPromises).then((base64Pictures) => {
        setBase64Pictures((prev) => [...prev, ...base64Pictures]);
        setNewPictures((prev) => [...prev, ...newFilesToUpload]);
      });
    }
  };

  const removePicture = (index, isOld) => {
    if (isOld) {
      const newPictures = [...pictures];
      newPictures.splice(index, 1);
      setPictures(newPictures);
    } else {
      const newBase64Pictures = [...base64Pictures];
      newBase64Pictures.splice(index, 1);
      setBase64Pictures(newBase64Pictures);
      const newPictures2 = [...newPictures];
      newPictures2.splice(index, 1);
      setNewPictures(newPictures);
    }

    setSelectedImage(null);
  };

  const handleGoBack = () => {
    navigate("/activity");
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      {" "}
      {/* Added pt-16 for top padding */}
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Update Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="description" {...field} />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Controller
                  name="location.address"
                  control={control}
                  render={({ field }) => <Input id="address" {...field} />}
                />
                {errors.location?.address && (
                  <p className="text-red-500 text-sm">
                    {errors.location.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Controller
                    name="duration"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        id="duration"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm">
                      {errors.duration.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timing">Timing</Label>
                  <Controller
                    name="timing"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        id="timing"
                        {...field}
                        onChange={(e) => {
                          const dateValue = new Date(e.target.value);
                          field.onChange(dateValue);
                        }}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().slice(0, 16)
                            : ""
                        }
                      />
                    )}
                  />
                  {errors.timing && (
                    <p className="text-red-500 text-sm">
                      {errors.timing.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        id="price"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialDiscount">Special Discount (%)</Label>
                  <Controller
                    name="specialDiscount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        id="specialDiscount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  {errors.specialDiscount && (
                    <p className="text-red-500 text-sm">
                      {errors.specialDiscount.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="currency">Currency </Label>
                <select
                  {...register("currency")}
                  className="border border-gray-300 rounded-xl p-2 w-full h-12 mb-4"
                  id="currency"
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency._id} value={currency._id}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <span className="text-red-500">
                    {errors.currency.message}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={categories}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.category && (
                  <p className="text-red-500 text-sm">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={tags}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  )}
                />
                {errors.tags && (
                  <p className="text-red-500 text-sm">{errors.tags.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isBookingOpen"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isBookingOpen"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isBookingOpen">Is Booking Open?</Label>
              </div>

              <div>
                <Label htmlFor="pictures">Add New Pictures</Label>
                <Input
                  id="pictures"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePicturesUpload}
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {pictures.map((picture, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={picture.url}
                        alt={`Product Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedImage(picture.url)}
                      />
                      <button
                        type="button"
                        onClick={() => removePicture(index, true)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {base64Pictures.map((picture, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={picture} // This will be the base64 string
                        alt={`Product Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedImage(picture)}
                      />
                      <button
                        onClick={() => removePicture(index, false)} // 'false' indicates it's an existing picture
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location (click to update)</Label>
                <div className="h-64 w-full rounded-md overflow-hidden">
                  <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>Open StreetMap</a> contributors"
                    />
                    <MapComponent />
                  </MapContainer>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Activity"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Updated</DialogTitle>
            <DialogDescription>
              The activity has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleGoBack}>Back to Activities</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh]">
            <img
              src={selectedImage}
              alt="Full size product"
              className="w-full h-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
