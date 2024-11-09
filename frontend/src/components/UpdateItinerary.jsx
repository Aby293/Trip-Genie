import React, { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import ReactSelect from "react-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import signUpPicture from "../assets/images/signUpPicture.jpeg";

const worldLanguages = [
  "Abkhaz",
  "Afar",
  "Afrikaans",
  "Akan",
  "Albanian",
  "Amharic",
  "Arabic",
  "Aragonese",
  "Armenian",
  "Assamese",
  "Avaric",
  "Avestan",
  "Aymara",
  "Azerbaijani",
  "Bambara",
  "Bashkir",
  "Basque",
  "Belarusian",
  "Bengali",
  "Bihari",
  "Bislama",
  "Bosnian",
  "Breton",
  "Bulgarian",
  "Burmese",
  "Catalan",
  "Chamorro",
  "Chechen",
  "Chichewa",
  "Chinese",
  "Chuvash",
  "Cornish",
  "Corsican",
  "Cree",
  "Croatian",
  "Czech",
  "Danish",
  "Divehi",
  "Dutch",
  "Dzongkha",
  "English",
  "Esperanto",
  "Estonian",
  "Ewe",
  "Faroese",
  "Fijian",
  "Finnish",
  "French",
  "Fula",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Guaraní",
  "Gujarati",
  "Haitian",
  "Hausa",
  "Hebrew",
  "Herero",
  "Hindi",
  "Hiri Motu",
  "Hungarian",
  "Interlingua",
  "Indonesian",
  "Interlingue",
  "Irish",
  "Igbo",
  "Inupiaq",
  "Ido",
  "Icelandic",
  "Italian",
  "Inuktitut",
  "Japanese",
  "Javanese",
  "Kalaallisut",
  "Kannada",
  "Kanuri",
  "Kashmiri",
  "Kazakh",
  "Khmer",
  "Kikuyu",
  "Kinyarwanda",
  "Kirghiz",
  "Komi",
  "Kongo",
  "Korean",
  "Kurdish",
  "Kwanyama",
  "Latin",
  "Luxembourgish",
  "Luganda",
  "Limburgish",
  "Lingala",
  "Lao",
  "Lithuanian",
  "Luba-Katanga",
  "Latvian",
  "Manx",
  "Macedonian",
  "Malagasy",
  "Malay",
  "Malayalam",
  "Maltese",
  "Māori",
  "Marathi",
  "Marshallese",
  "Mongolian",
  "Nauru",
  "Navajo",
  "Norwegian Bokmål",
  "North Ndebele",
  "Nepali",
  "Ndonga",
  "Norwegian Nynorsk",
  "Norwegian",
  "Nuosu",
  "South Ndebele",
  "Occitan",
  "Ojibwe",
  "Old Church Slavonic",
  "Oromo",
  "Oriya",
  "Ossetian",
  "Panjabi",
  "Pāli",
  "Persian",
  "Polish",
  "Pashto",
  "Portuguese",
  "Quechua",
  "Romansh",
  "Kirundi",
  "Romanian",
  "Russian",
  "Sanskrit",
  "Sardinian",
  "Sindhi",
  "Northern Sami",
  "Samoan",
  "Sango",
  "Serbian",
  "Scottish Gaelic",
  "Shona",
  "Sinhala",
  "Slovak",
  "Slovene",
  "Somali",
  "Southern Sotho",
  "Spanish",
  "Sundanese",
  "Swahili",
  "Swati",
  "Swedish",
  "Tamil",
  "Telugu",
  "Tajik",
  "Thai",
  "Tigrinya",
  "Tibetan",
  "Turkmen",
  "Tagalog",
  "Tswana",
  "Tonga",
  "Turkish",
  "Tsonga",
  "Tatar",
  "Twi",
  "Tahitian",
  "Uighur",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Venda",
  "Vietnamese",
  "Volapük",
  "Walloon",
  "Welsh",
  "Wolof",
  "Western Frisian",
  "Xhosa",
  "Yiddish",
  "Yoruba",
  "Zhuang",
  "Zulu",
];

const ActivityForm = ({ onSave, onClose, initialData = null }) => {
  //check if the pictures in the activity from the initial data are in binary format, if so convert them to base64
  if (initialData?.pictures) {
    initialData.pictures.forEach((picture, index) => {
      if (picture instanceof Blob) {
        const reader = new FileReader();
        reader.readAsDataURL(picture);
        reader.onloadend = () => {
          initialData.pictures[index] = reader.result;
        };
      }
    });
  }

  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pictures, setPictures] = useState(initialData?.pictures || []);
  const [newPictures, setNewPictures] = useState([]);
  const [base64Pictures, setBase64Pictures] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePicturesUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newFilePictures = Array.from(files);
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
      setNewPictures(newPictures2);
    }

    setSelectedImage(null);
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {},
  });

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setValue(
        "tags",
        initialData.tags.map((tag) => tag._id)
      );
      setValue(
        "category",
        initialData.category.map((category) => category._id)
      );

      if (initialData.timing) {
        setValue("activityTime", initialData.timing.split("T")[1].slice(0, 5));
      }
    }
  }, [initialData, setValue]);

  const fetchTags = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/getAllTags");
      setTags(
        response.data.map((tag) => ({ value: tag._id, label: tag.type }))
      );
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/getAllCategories"
      );
      setCategories(
        response.data.map((cat) => ({ value: cat._id, label: cat.name }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      tags: data.tags || [],
      category: data.category || [],
      timing: `${new Date().toISOString().split("T")[0]}T${data.activityTime}`,
      pictures: [...pictures, ...newPictures],
    };
    onSave(formattedData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description", { required: "Description is required" })}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...register("location.address", { required: "Address is required" })}
        />
        {errors.location?.address && (
          <p className="text-red-500 text-xs mt-1">
            {errors.location.address.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            {...register("location.coordinates.longitude", {
              required: "Longitude is required",
            })}
          />
          {errors.location?.coordinates?.longitude && (
            <p className="text-red-500 text-xs mt-1">
              {errors.location.coordinates.longitude.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register("location.coordinates.latitude", {
              required: "Latitude is required",
            })}
          />
          {errors.location?.coordinates?.latitude && (
            <p className="text-red-500 text-xs mt-1">
              {errors.location.coordinates.latitude.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          {...register("duration", { required: "Duration is required" })}
        />
        {errors.duration && (
          <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="activityTime">Time</Label>
          <Input
            id="activityTime"
            type="time"
            {...register("activityTime", { required: "Time is required" })}
          />
          {errors.activityTime && (
            <p className="text-red-500 text-xs mt-1">
              {errors.activityTime.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <Controller
          name="tags"
          control={control}
          rules={{ required: "At least one tag is required" }}
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={tags}
              isMulti
              className="react-select-container"
              classNamePrefix="react-select"
              value={tags.filter((option) =>
                field.value?.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                field.onChange(selectedOptions.map((option) => option.value))
              }
            />
          )}
        />
        {errors.tags && (
          <p className="text-red-500 text-xs mt-1">{errors.tags.message}</p>
        )}
      </div>

      <div>
        <Label>Categories</Label>
        <Controller
          name="category"
          control={control}
          rules={{ required: "At least one category is required" }}
          render={({ field }) => (
            <ReactSelect
              {...field}
              options={categories}
              isMulti
              className="react-select-container"
              classNamePrefix="react-select"
              value={categories.filter((option) =>
                field.value?.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                field.onChange(selectedOptions.map((option) => option.value))
              }
            />
          )}
        />
        {errors.category && (
          <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="pictures" className="text-sm font-medium">
          Add Activity Pictures
        </Label>
        <Input
          id="pictures"
          type="file"
          multiple
          onChange={handlePicturesUpload}
        />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {pictures.map((picture, index) => (
          <div key={`existing-${index}`} className="relative">
            <img
              src={picture.url ? picture.url : picture}
              alt={`Activity Existing ${index + 1}`}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => {
                setSelectedImage(picture.url ? picture.url : picture);
                setIsImageViewerOpen(true);
              }}
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
          <div key={`new-${index}`} className="relative">
            <img
              src={picture}
              alt={`Activity New ${index + 1}`}
              className="w-full h-32 object-cover rounded cursor-pointer"
              onClick={() => {
                setSelectedImage(picture);
                setIsImageViewerOpen(true);
              }}
            />
            <button
              type="button"
              onClick={() => removePicture(index, false)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <Button type="submit">Save Activity</Button>
    </form>
  );
};

export default function UpdateItinerary() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState({
    title: "",
    language: "",
    price: "",
    pickUpLocation: "",
    dropOffLocation: "",
    accessibility: false,
    isRepeated: false,
    availableDates: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchItineraryDetails();
  }, [id]);

  const fetchItineraryDetails = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      const response = await axios.get(
        `http://localhost:4000/tour-guide/itineraries/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setItinerary(response.data);
      setError(null);
    } catch (err) {
      setError("Error fetching data. Please try again later.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItinerary((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (value) => {
    setItinerary((prev) => ({ ...prev, language: value }));
  };

  const handleSwitchChange = (name) => {
    setItinerary((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDateChange = (value, index) => {
    const newDates = [...itinerary.availableDates];
    newDates[index].date = value;
    setItinerary((prev) => ({ ...prev, availableDates: newDates }));
  };

  const addDate = (e) => {
    e.preventDefault();
    const newDate = { date: "" };
    setItinerary((prev) => ({
      ...prev,
      availableDates: [...prev.availableDates, newDate],
    }));
  };

  const removeDate = (index) => {
    setItinerary((prev) => ({
      ...prev,
      availableDates: prev.availableDates.filter((_, i) => i !== index),
    }));
  };

  const handleAddActivity = (activity) => {
    console.log(activity.pictures);
    const newActivity = {
      ...activity,
      tags: activity.tags.map((tagId) => ({ _id: tagId })),
      category: activity.category.map((categoryId) => ({ _id: categoryId })),
      pictures: activity.pictures,
    };
    setItinerary((prev) => ({
      ...prev,
      activities: [...prev.activities, newActivity],
    }));
    setShowActivityForm(false);
  };

  const handleEditActivity = (updatedActivity) => {
    console.log(updatedActivity.pictures);
    setItinerary((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a._id === editingActivity._id
          ? {
              ...updatedActivity,
              _id: a._id,
              tags: updatedActivity.tags.map((tagId) => ({ _id: tagId })),
              category: updatedActivity.category.map((categoryId) => ({
                _id: categoryId,
              })),
              pictures: updatedActivity.pictures,
            }
          : a
      ),
    }));
    setShowActivityForm(false);
    setEditingActivity(null);
  };

  const removeActivity = (activityId) => {
    setItinerary((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a._id !== activityId),
    }));
  };

  const isFormValid = useMemo(() => {
    return (
      itinerary.title.trim() !== "" &&
      itinerary.language !== "" &&
      itinerary.price !== "" &&
      !isNaN(itinerary.price) &&
      Number(itinerary.price) >= 0 &&
      itinerary.pickUpLocation.trim() !== "" &&
      itinerary.dropOffLocation.trim() !== "" &&
      itinerary.availableDates.length > 0 &&
      itinerary.availableDates.every((date) => date.date) &&
      itinerary.activities.length > 0
    );
  }, [itinerary]);

  const today = new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0];

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setShowErrorPopup("Please fill in all required fields before updating.");
      return;
    }

    if (itinerary.availableDates.length > 1 && !itinerary.isRepeated) {
      setShowErrorPopup(
        "If the itinerary is not repeated you can only choose one date."
      );
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("jwt");
      console.log(itinerary);
      const formData = new FormData();
      formData.append("title", itinerary.title);
      formData.append("language", itinerary.language);
      formData.append("price", itinerary.price);
      formData.append("pickUpLocation", itinerary.pickUpLocation);
      formData.append("dropOffLocation", itinerary.dropOffLocation);
      formData.append("accessibility", itinerary.accessibility);
      formData.append("isRepeated", itinerary.isRepeated);
      formData.append(
        "availableDates",
        JSON.stringify(itinerary.availableDates)
      );
      formData.append("activities", JSON.stringify(itinerary.activities));
      itinerary.activities.forEach((activity, index) => {
        activity.pictures.forEach((file, fileIndex) => {
          if (file instanceof File) {
            formData.append(
              `activities[${index}][pictures][${fileIndex}]`,
              file
            );
          }
        });
      });

      console.log("hi");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      await axios.put(
        `http://localhost:4000/tour-guide/itineraries/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowSuccessPopup(true);
    } catch (err) {
      setShowErrorPopup("Error updating itinerary. Please try again later.");
      console.error("Error updating itinerary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-2"
        style={{
          backgroundImage: `linear-gradient(rgba(93, 146, 151, 0.5), rgba(93, 146, 151, 0.5)), url(${signUpPicture})`,
        }}
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-7xl flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 bg-[#B5D3D1] p-6">
            <h2 className="text-3xl font-bold text-[#1A3B47] mb-2">
              Update Itinerary
            </h2>
            <p className="text-sm mb-6 text-[#1A3B47]">
              Update the details of your itinerary. Make sure all information is
              accurate and up-to-date.
            </p>
          </div>
          <div className="w-full md:w-3/4 p-6">
            <form onSubmit={handleUpdate} className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="title">Itinerary Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={itinerary.title}
                  onChange={handleChange}
                />
                {!itinerary.title.trim() && (
                  <span className="text-red-500 text-xs">
                    Title is required.
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={itinerary.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {worldLanguages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!itinerary.language && (
                  <span className="text-red-500 text-xs">
                    Language is required.
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={itinerary.price}
                  onChange={handleChange}
                />
                {(itinerary.price === "" ||
                  isNaN(itinerary.price) ||
                  Number(itinerary.price) < 0) && (
                  <span className="text-red-500 text-xs">
                    Price must be a positive number.
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="pickUpLocation">Pick-Up Location</Label>
                <Input
                  id="pickUpLocation"
                  name="pickUpLocation"
                  value={itinerary.pickUpLocation}
                  onChange={handleChange}
                />
                {!itinerary.pickUpLocation.trim() && (
                  <span className="text-red-500 text-xs">
                    Pick-up location is required.
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="dropOffLocation">Drop-off Location</Label>
                <Input
                  id="dropOffLocation"
                  name="dropOffLocation"
                  value={itinerary.dropOffLocation}
                  onChange={handleChange}
                />
                {!itinerary.dropOffLocation.trim() && (
                  <span className="text-red-500 text-xs">
                    Drop-off location is required.
                  </span>
                )}
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="accessibility"
                  checked={itinerary.accessibility}
                  onCheckedChange={() => handleSwitchChange("accessibility")}
                />
                <Label htmlFor="accessibility">Accessible for Disabled</Label>
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="isRepeated"
                  checked={itinerary.isRepeated}
                  onCheckedChange={() => handleSwitchChange("isRepeated")}
                />
                <Label htmlFor="isRepeated">Is Repeated</Label>
              </div>

              <div className="col-span-2 p-4 border rounded space-y-4">
                <Label className="text-sm font-medium">Available Dates</Label>

                {itinerary.availableDates.map((dateObj, dateIndex) => (
                  <div
                    key={dateIndex}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <Input
                      type="date"
                      value={dateObj.date.split("T")[0]}
                      min={today} // Ensures that dates can't be set before today
                      onChange={(e) =>
                        handleDateChange(e.target.value, dateIndex)
                      }
                      className={`w-40 ${
                        !dateObj.date ? "border-red-500" : ""
                      }`}
                    />
                    {(itinerary.isRepeated ||
                      itinerary.availableDates.length > 1) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeDate(dateIndex)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}

                {(itinerary.isRepeated ||
                  itinerary.availableDates.length === 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDate}
                    className="mt-2"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Date
                  </Button>
                )}

                {/* Error message if no dates are available */}
                {itinerary.availableDates.length === 0 && (
                  <span className="text-red-500 text-xs mt-2">
                    At least one date is required.
                  </span>
                )}
              </div>

              <div className="col-span-2">
                <Label className="text-sm font-medium">Activities</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {itinerary.activities.map((activity) => (
                    <li
                      key={activity._id}
                      className="flex justify-between items-center"
                    >
                      <span>{activity.name}</span>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActivity(activity);
                            setShowActivityForm(true);
                          }}
                          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition duration-300 ease-in-out mr-2"
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeActivity(activity._id)}
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition duration-300 ease-in-out"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null);
                    setShowActivityForm(true);
                  }}
                  className="w-full mt-2 bg-[#1A3B47]"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
                {itinerary.activities.length === 0 && (
                  <p className="text-red-500 text-xs mt-2">
                    Please add at least one activity
                  </p>
                )}
              </div>

              {!isFormValid && (
                <Alert variant="destructive" className="col-span-4">
                  <AlertDescription>
                    Please fill in all required fields before updating the
                    itinerary.
                  </AlertDescription>
                </Alert>
              )}

              <div className="col-span-4 flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#5D9297] text-white hover:bg-[#1A3B47]"
                  disabled={!isFormValid || loading}
                >
                  {loading ? "Updating..." : "Update Itinerary"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={showActivityForm} onOpenChange={setShowActivityForm}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Edit Activity" : "Add New Activity"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <ActivityForm
              onSave={editingActivity ? handleEditActivity : handleAddActivity}
              onClose={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
              initialData={editingActivity}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
              Itinerary Updated
            </DialogTitle>
            <DialogDescription>
              The itinerary has been successfully updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/all-itineraries")}>
              Back to All Itineraries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showErrorPopup !== null}
        onOpenChange={() => setShowErrorPopup(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <XCircle className="w-6 h-6 text-red-500 inline-block mr-2" />
              Failed to Update Itinerary
            </DialogTitle>
            <DialogDescription>
              {showErrorPopup ||
                "An error occurred while updating the itinerary."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setShowErrorPopup(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
