import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { UserGuide } from "@/components/UserGuide.jsx"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import PaymentPopup from "@/components/payment-popup-hotel";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Star, Wifi, Coffee, Tv, AirVent } from "lucide-react";
import Loader from "@/components/Loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Cookies from "js-cookie";
import axios from "axios";

const API_KEY = import.meta.env.VITE_HOTELS_API_KEY2;

export default function HotelDetails() {
  const { hotelId } = useParams();
  const [paymentType, setPaymentType] = useState("CreditCard");
  const [searchParams] = useSearchParams();
  const [hotelData, setHotelData] = useState(null);
  const [hotelPhotos, setHotelPhotos] = useState([]);
  const [hotelFacilities, setHotelFacilities] = useState([]);
  const [groupedRooms, setGroupedRooms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingPopupError, setBookingPopupError] = useState("");

  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isSuccessWalletPopupOpen, setIsSuccessWalletPopupOpen] = useState(false);

  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null);


  const checkinDate = searchParams.get("checkinDate");
  const checkoutDate = searchParams.get("checkoutDate");
  const numberOfAdults = parseInt(searchParams.get("adults") || "1", 10);

  const hotelDataFetched = useRef(false);
  const hotelPhotosFetched = useRef(false);
  const hotelFacilitiesFetched = useRef(false);
  const roomListFetched = useRef(false);

  useEffect(() => {
    const fetchCurrencyInfo = async () => {
      try {
        const token = Cookies.get("jwt");
        const response = await fetch(
          "http://localhost:4000/tourist/currencies/code",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch currency information");
        }

        const data = await response.json();
        setCurrencyCode(data);
      } catch (err) {
        console.error("Failed to fetch currency information:", err);
        setError("Failed to fetch currency information. Using default USD.");
      }
    };

    fetchCurrencyInfo();
    
  }, []);

  useEffect(()=>{
    fetchUserInfo();
},[])

  const fetchUserInfo = async () => {
    const role = Cookies.get("role") || "guest";

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt");
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currencyId = response.data.preferredCurrency;

        const response2 = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserPreferredCurrency(response2.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };


  useEffect(() => {
    const fetchHotelDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const parsedHotelId = parseInt(hotelId, 10);
        if (isNaN(parsedHotelId)) {
          throw new Error("Invalid hotel ID");
        }

        const headers = {
          "x-rapidapi-host": "booking-com.p.rapidapi.com",
          "x-rapidapi-key": API_KEY,
        };

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const fetchWithCache = async (url, cachedData, setData, fetchFlag) => {
          if (fetchFlag.current) return;
          fetchFlag.current = true;
          const response = await fetch(url, { headers });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setData(data);
          await delay(1000);
        };

        await fetchWithCache(
          `https://booking-com.p.rapidapi.com/v1/hotels/data?hotel_id=${parsedHotelId}&locale=en-gb`,
          hotelData,
          setHotelData,
          hotelDataFetched
        );

        await fetchWithCache(
          `https://booking-com.p.rapidapi.com/v1/hotels/photos?hotel_id=${parsedHotelId}&locale=en-gb`,
          hotelPhotos,
          setHotelPhotos,
          hotelPhotosFetched
        );

        await fetchWithCache(
          `https://booking-com.p.rapidapi.com/v1/hotels/facilities?hotel_id=${parsedHotelId}&locale=en-gb`,
          hotelFacilities,
          setHotelFacilities,
          hotelFacilitiesFetched
        );

        await fetchWithCache(
          `https://booking-com.p.rapidapi.com/v1/hotels/room-list?checkin_date=${checkinDate}&checkout_date=${checkoutDate}&hotel_id=${parsedHotelId}&adults_number_by_rooms=${numberOfAdults}&children_number_by_rooms=0&currency=${currencyCode}&units=metric&locale=en-gb`,
          null,
          (data) => {
            if (data && data[0]) {
              const extractRoomInfo = (data) => {
                return data[0].block.map((room) => ({
                  name: room.room_name,
                  price: room.price_breakdown?.gross_price,
                  allInclusivePrice: room.price_breakdown?.all_inclusive_price || null,
                  currency: room.price_breakdown?.currency,
                }));
              };

              const extractMoreRoomInfo = (data) => {
                if (data[0].rooms && Array.isArray(data[0].rooms)) {
                  return data[0].rooms;
                } else if (data[0].rooms && typeof data[0].rooms === 'object') {
                  return Object.values(data[0].rooms);
                } else {
                  console.error('Unexpected rooms data structure:', data[0].rooms);
                  return [];
                }
              };

              const basicRoomInfo = extractRoomInfo(data);
              const moreRoomInfo = extractMoreRoomInfo(data);

              const mergedRoomInfo = basicRoomInfo
                .map((room, index) => ({
                  ...room,
                  ...(moreRoomInfo[index] || {}),
                }))
                .filter(room =>
                  (room.bed_configurations && room.bed_configurations.length > 0) &&
                  (room.facilities && room.facilities.length > 0)
                );

              const grouped = mergedRoomInfo.reduce((acc, room) => {
                if (!acc[room.name]) {
                  acc[room.name] = [];
                }
                acc[room.name].push(room);
                return acc;
              }, {});

              console.log("Grouped Rooms data:", grouped);
              setGroupedRooms(grouped);
            } else {
              setGroupedRooms({});
              console.log("No rooms data available:", data);
            }
          },
          roomListFetched
        );
      } catch (err) {
        setError(
          "An error occurred while fetching hotel details. Please try again."
        );
        console.error("Error fetching hotel details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, currencyCode, checkinDate, checkoutDate, numberOfAdults]);

  const handleBookRoom = (room, isAllInclusive) => {
    setSelectedRoom({
      ...room,
      isAllInclusive,
      totalPrice: isAllInclusive ? room.allInclusivePrice : room.price
    });
    setIsBookingConfirmationOpen(true);
  };

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };



  const guideSteps = [
    {
      target: "body",
      content:
        "Welcome to the hotel booking page! Here you can search for hotels and book rooms for your next trip.",
      placement: "center",
    },
    {
      target: ".hotelPictures",
      content:
        "Here you can see the pictures of the hotel. Click on the arrows to view more pictures.",
      placement: "top",
    },
    {
      target: ".hotelInfo",
      content:
        "This section contains information about the hotel, such as its address, city, country and review score.",
      placement: "top",
    },
    {
      target: ".Facilities",
      content: "This section displays all of the facilities available at the hotel.",
      placement: "top",
    },
    {
      target: ".roomTypes",
      content: 
        "This section displays all the available room types at the hotel. Click on a room type to view more details and book a room.",
      placement: "top",
    },
    {
      target: ".booking",
      content: 
        "Click on the 'Book Now' button to book a room. You can also book an all-inclusive room by clicking on the 'Book All Inclusive' button. Do not forget to select the number of rooms you want to book!", 
      placement: "top",
    },
  ];

  useEffect(() => {
    const handleBookingSuccess = async () => {
      const success = searchParams.get("success");
      const quantity = searchParams.get("quantity");
      const selectedDateStr = searchParams.get("selectedDate");
      const sessionId = searchParams.get("session_id");
  
      // Extract additional parameters from the URL
      const hotelID = searchParams.get("hotelID");
      const roomName = searchParams.get("roomName");
      const checkinDate = searchParams.get("checkinDate");
      const checkoutDate = searchParams.get("checkoutDate");
      const numberOfRooms = searchParams.get("numberOfRooms");
      const numberOfAdults = searchParams.get("numberOfAdults");
  
      console.log(success, sessionId, hotelID, roomName, checkinDate, checkoutDate, numberOfRooms, numberOfAdults);
  
      if (sessionId && success === "true") {
        try {
          const response = await axios.get(
            `http://localhost:4000/check-payment-status?session_id=${sessionId}`
          );
  
          console.log("Payment status response:", response.data);
  
          if (response.data.status === "paid") {
            setIsSuccessPopupOpen(true);
            // Update any other necessary state here
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }
    };
  
    handleBookingSuccess();
  }, [searchParams]);
  

  const handleFinalOK = async () => {
    if (searchParams.get("success") === "true") {
      const quantity = searchParams.get("quantity");
      const selectedDateStr = searchParams.get("selectedDate");
      const hotelID = searchParams.get("hotelID");
      const roomName = searchParams.get("roomName");
      const checkinDate = searchParams.get("checkinDate");
      const checkoutDate = searchParams.get("checkoutDate");
      const numberOfRooms = searchParams.get("numberOfRooms");
      const numberOfAdults = searchParams.get("numberOfAdults");
      const price = searchParams.get("price");
  
      try {
        // Assuming handleBooking uses these parameters
        await handleConfirmBooking("CreditCard", parseInt(quantity), selectedDateStr, hotelID, roomName, checkinDate, checkoutDate, numberOfRooms, numberOfAdults,price);
      } catch (error) {
        console.error("Error handling booking:", error);
        // Handle the error appropriately
      }
    }
  
    setIsSuccessPopupOpen(false);
  
    // Clear search params from URL
    searchParams.delete("success");
    searchParams.delete("quantity");
    searchParams.delete("selectedDate");
    searchParams.delete("session_id");
    searchParams.delete("hotelID");
    searchParams.delete("roomName");
    searchParams.delete("checkinDate");
    searchParams.delete("checkoutDate");
    searchParams.delete("numberOfRooms");
    searchParams.delete("numberOfAdults");
  
    const newUrl = `${window.location.pathname}`;
    window.history.replaceState(null, '', newUrl);
  
    
  };
  

  const handleConfirmBooking = async (paymentType, quantity, date, hotelID, roomName, checkinDate, checkoutDate, numberOfRooms, numberOfAdults,price)=> {
    try {
      console.log(paymentType, quantity, date, hotelID, roomName, checkinDate, checkoutDate, numberOfRooms, numberOfAdults,price);
      const token = Cookies.get("jwt");
      const response = await fetch("http://localhost:4000/tourist/book-hotel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelID,
          hotelName: hotelData.name,
          checkinDate,
          checkoutDate,
          numberOfRooms,
          roomName,
          price,
          numberOfAdults,
          paymentType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message === "Insufficient funds in wallet") {
          setBookingPopupError(
            "Insufficient funds, please choose a different payment method or update your wallet."
          );
          return;
        } else {
          throw new Error(errorData.message || "Failed to book hotel");
        }
      } 

      const data = await response.json();
      console.log("Booking successful:", data);
      setBookingSuccess(true);
      setBookingError("");
      setIsSuccessPopupOpen(true);
      setIsBookingConfirmationOpen(false);
    } catch (error) {
      console.error("Booking error:", error);
      setBookingError("Failed to book the hotel. Please try again.");
      setBookingSuccess(false);
      setIsBookingConfirmationOpen(false);
    } finally {
    }
  };

  const renderFacilities = () => {
    if (!hotelFacilities || hotelFacilities.length === 0) {
      return null;
    }

    return (
      <Card className="mt-6 Facilities">
        <CardHeader>
          <CardTitle>Facilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hotelFacilities.map((facility, index) => (
              <Badge key={index} variant="outline">
                {facility.facility_name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRoomGroup = (roomName, rooms) => {
    const validRooms = rooms.filter(room =>
      room.bed_configurations &&
      room.bed_configurations.length > 0 &&
      room.facilities &&
      room.facilities.length > 0
    );

    if (validRooms.length === 0) {
      return null;
    }

    return (
      <AccordionItem value={roomName} key={roomName}>
        <AccordionTrigger>{roomName}</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validRooms.map((room, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <CardTitle>{room.name}</CardTitle>
                  <CardDescription>
                    {room.price ? (
                      <div>
                        <span className="font-semibold text-xl">
                          Price: {room.price} {currencyCode} 
                        </span>
                        {room.allInclusivePrice && room.allInclusivePrice !== room.price && (
                          <div className="text-sm text-muted-foreground">
                            All Inclusive: {room.allInclusivePrice} {currencyCode}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Price not available</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Carousel className="w-full mb-6">
                    <CarouselContent>
                      {room.photos && room.photos.map((photo, photoIndex) => (
                        <CarouselItem
                          key={photoIndex}
                          className="md:basis-1/2 lg:basis-1/3"
                        >
                          <img
                            src={photo.url_original}
                            alt={`Room photo ${photoIndex + 1}`}
                            className={`aspect-${photo.ratio} rounded-lg`}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.highlights && room.highlights.map((highlight, i) => (
                      <Badge key={i} variant="outline">
                        {highlight.translated_name}
                      </Badge>
                    ))}
                  </div>
                  <p className="font-bold mb-2">Bed Configuration:</p>
                  <ul className="list-disc list-inside mb-4">
                    {room.bed_configurations && room.bed_configurations[0]?.bed_types.map((bed, i) => (
                      <li key={i}>{bed.name_with_count}</li>
                    ))}
                  </ul>
                  <p className="font-bold mb-2">Facilities:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {room.facilities && room.facilities.map((facility, i) => (
                      <Badge key={i} variant="secondary">
                        {facility.name === "Free WiFi" && <Wifi className="w-4 h-4 mr-1" />}
                        {facility.name === "Tea/Coffee maker" && <Coffee className="w-4 h-4 mr-1" />}
                        {facility.name === "TV" && <Tv className="w-4 h-4 mr-1" />}
                        {facility.name === "Air conditioning" && <AirVent className="w-4 h-4 mr-1" />}
                        {facility.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 space-x-2 booking">
                    <Button onClick={() => handleBookRoom(room, false)}>Book Now</Button>
                    {room.allInclusivePrice && room.allInclusivePrice !== room.price && (
                      <Button onClick={() => handleBookRoom(room, true)}>Book All Inclusive</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || !hotelData) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        {error || "Failed to load hotel details"}
      </div>
    );
  }

  return (
    <div>
      <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      </div>
      <div className="container mx-auto p-4 mt-5">
        <h1 className="text-3xl font-bold mb-6">{hotelData.name}</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="md:w-1/2 hotelPictures">
            <Carousel className="w-full max-w-xl">
              <CarouselContent>
                {hotelPhotos.map((photo, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <img
                      src={photo.url_1440}
                      alt={`Hotel photo ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          <Card className="md:w-1/2 hotelInfo">
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{hotelData.address}</p>
              <p className="mb-2">
                {hotelData.city}, {hotelData.country}
              </p>
              <div className="flex items-center mb-2">
                {[...Array(Math.floor(hotelData.review_score / 2))].map(
                  (_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  )
                )}
                <span className="ml-2">
                  {hotelData.review_score / 2} ({hotelData.review_nr} reviews)
                </span>
              </div>
              <p>{hotelData.description_translations?.en}</p>
            </CardContent>
          </Card>
          <PaymentPopup
  isBookingConfirmationOpen={isBookingConfirmationOpen}
  setIsBookingConfirmationOpen={setIsBookingConfirmationOpen}
  selectedRoom={selectedRoom?.name}
  price={selectedRoom?.totalPrice}
  currencyCode={currencyCode}
  currencySymbol={userPreferredCurrency?.symbol}
  checkinDate={checkinDate}
  checkoutDate={checkoutDate}
  numberOfAdults={numberOfAdults}
  hotelName={hotelData?.name}
  stripeKey={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
  hotelID={hotelId}
  returnLocation={`http://localhost:3000/hotels/${hotelId}?checkinDate=${checkinDate}&checkoutDate=${checkoutDate}&adults=${numberOfAdults}`}
  roomName={selectedRoom?.name}
  maxRooms={10}
  onWalletPayment={handleConfirmBooking}
  onSuccess={setIsSuccessWalletPopupOpen}
/>

        </div>
        {renderFacilities()} {/* Add this line to render the facilities section */}

        <Card className="mt-6 roomTypes">
          <CardHeader>
            <CardTitle>Room Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedRooms)
                .filter(([_, rooms]) => rooms.some(room =>
                  room.bed_configurations &&
                  room.bed_configurations.length > 0 &&
                  room.facilities &&
                  room.facilities.length > 0
                ))
                .map(([roomName, rooms]) => renderRoomGroup(roomName, rooms))
              }
            </Accordion>
          </CardContent>
        </Card>
        {/* <Dialog open={isBookingConfirmationOpen} onOpenChange={setIsBookingConfirmationOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Booking</DialogTitle>
              <DialogDescription>
                Please confirm your room booking details.
              </DialogDescription>
            </DialogHeader>
            {selectedRoom && (
              <div className="mt-4 space-y-4">
                <p><strong>Room:</strong> {selectedRoom.name}</p>
                <p><strong>Price:</strong> {selectedRoom.totalPrice} {currencyCode}</p>
                <p><strong>Type:</strong> {selectedRoom.isAllInclusive ? 'All Inclusive' : 'Standard'}</p>
                <p><strong>Check-in Date:</strong> {checkinDate}</p>
                <p><strong>Check-out Date:</strong> {checkoutDate}</p>
                <p><strong>Number of Adults:</strong> {numberOfAdults}</p>
                <div className="space-y-2">
                  <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                  <Select value={numberOfRooms.toString()} onValueChange={(value) => setNumberOfRooms(parseInt(value))}>
                    <SelectTrigger id="numberOfRooms">
                      <SelectValue placeholder="Select number of rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Payment Type</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType} className="col-span-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CreditCard" id="credit" />
                  <Label htmlFor="CreditCard">Credit Card/Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Wallet" id="Wallet" />
                  <Label htmlFor="Wallet">Wallet</Label>
                </div>
              </RadioGroup>
            </div>
            {bookingPopupError && <div className="text-red-500 text-sm mt-2">{bookingPopupError}</div>}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsBookingConfirmationOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmBooking}>Confirm Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
       
        <Dialog open={isSuccessPopupOpen} onOpenChange={setIsSuccessPopupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Successful</DialogTitle>
              <DialogDescription>
                Your hotel room has been booked successfully.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => handleFinalOK()}>Close</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={isSuccessWalletPopupOpen} onOpenChange={setIsSuccessWalletPopupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Successful</DialogTitle>
              <DialogDescription>
                Your hotel room has been booked successfully.
                {/* <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Label className="text-right">Amount Paid:</Label>
                  <div>  {formatPrice(calculateTotalPrice())} </div>
                </div>
                {paymentType === "Wallet" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Label className="text-right">New Wallet Balance:</Label>
                    <div>{formatPrice(tourist?.wallet - calculateTotalPrice())}</div>
                  </div>
                )}</div> */}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setIsSuccessWalletPopupOpen(false)}>Close</Button>
          </DialogContent>
        </Dialog>
        {bookingError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Booking Error</AlertTitle>
            <AlertDescription>{bookingError}</AlertDescription>
          </Alert>
        )}
      </div>
      {(getUserRole() === "guest" || getUserRole() === "tourist") && (
        <UserGuide
          steps={guideSteps}
          pageName="hotel-details"
        />
      )}
    </div>
  );
}