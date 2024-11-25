import { useState, useEffect } from "react"
import { ArrowDown, CheckCircle, XCircle } from 'lucide-react'
import { loadStripe } from "@stripe/stripe-js"
import axios from "axios"
import Cookies from "js-cookie"
import { format, addDays, addBusinessDays } from "date-fns"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { useSearchParams } from "react-router-dom"
import ShippingAddress from "@/pages/AddShippingAddress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"


const checkoutSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetNumber: z.string().min(1, "Street number is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  locationType: z.string().min(1, "Location type is required"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryType: z.string().min(1, "Delivery type is required"),
  paymentMethod: z.enum(
    ["credit_card", "debit_card", "wallet", "cash_on_delivery"],
    {
      required_error: "Payment method is required",
    }
  ),
  selectedCard: z
    .string()
    .optional()
    .refine((val) => val && val.length > 0, {
      message: "Please select a card",
      path: ["selectedCard"],
    }),
})

export default function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [paySucess, setPaySucess] = useState(false)
  const [activeSection, setActiveSection] = useState("personal")
  const [userRole, setUserRole] = useState("tourist")
  const [userPreferredCurrency, setUserPreferredCurrency] = useState(null)
  const [exchangeRates, setExchangeRates] = useState({})
  const [currencySymbol, setCurrencySymbol] = useState({})
  const [cartItems, setCartItems] = useState([])
  const [savedCards, setSavedCards] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isPriceLoading, setIsPriceLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCardForm, setShowAddCardForm] = useState(false)
  const [showSavedAddresses, setShowSavedAddresses] = useState(false)
  const [showSavedCards, setShowSavedCards] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const navigate = useNavigate()
  const [redirect,setRedirect] = useState(null);
  const [isAddressDialogOpenDetail, setIsAddressDialogOpenDetail] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null)
  const [addressDetails, setAddressDetails] = useState({
    streetName: "",
    streetNumber: "",
    floorUnit: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    landmark: "",
    locationType: "",
    default: false,
  })
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    holderName: "",
    cvv: "",
    cardType: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseStatus, setPurchaseStatus] = useState(null)
  const [purchaseError, setPurchaseError] = useState(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoDetails, setPromoDetails] = useState(null)
  const [promoError, setPromoError] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountedTotal, setDiscountedTotal] = useState(0)
  const [currentPromoCode, setCurrentPromoCode] = useState("")
  const [paySuccess, setPaySuccess] = useState(false)
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState("")


  const [deliveryType, setDeliveryType] = useState("Express")
  const [deliveryTime, setDeliveryTime] = useState("morning")
  const [paymentMethod, setPaymentMethod] = useState("")



  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      streetName: "",
      streetNumber: "",
      city: "",
      state: "",
      postalCode: "",
      locationType: "",
      deliveryType: searchParams.get("deliveryType") || "",
      deliveryTime: searchParams.get("deliveryTime") || "",
      paymentMethod: "",
      selectedCard: "",
    },
  })

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    const loadPrices = async () => {
      setIsPriceLoading(true)
      await fetchCart()
      await fetchExchangeRate()
      await getCurrencySymbol()
      setIsPriceLoading(false)
    }
    loadPrices()
  }, [userPreferredCurrency])

  const fetchUserInfo = async () => {
    
    const role = Cookies.get("role") || "guest"
    setUserRole(role)

    if (role === "tourist") {
      try {
        const token = Cookies.get("jwt")
        const response = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = response.data
        const currencyId = userData.preferredCurrency
        setSavedCards(userData.cards || [])
        setSavedAddresses(userData.shippingAddresses || [])

        const defaultAddress = userData.shippingAddresses?.find(
          (addr) => addr.default
        )
        const defaultCard = userData.cards?.find((card) => card.default)

        if (defaultAddress) {
          setSelectedAddress(defaultAddress)
          Object.keys(defaultAddress).forEach((key) => {
            if (key !== "default") {
              form.setValue(key, defaultAddress[key])
            }
          })
        }

        if (defaultCard) {
          setSelectedCard(defaultCard)
          form.setValue(
            "paymentMethod",
            defaultCard.cardType === "Credit Card"
              ? "credit_card"
              : "debit_card"
          )
          form.setValue("selectedCard", defaultCard.cardNumber)
        }

        form.setValue("firstName", userData.fname || "")
        form.setValue("lastName", userData.lname || "")
        form.setValue("email", userData.email || "")
        form.setValue("phone", userData.mobile || "")

        if (
          response.data.currentPromoCode &&
          response.data.currentPromoCode.code
        ) {
          setCurrentPromoCode(response.data.currentPromoCode.code)
          setPromoCode(response.data.currentPromoCode.code)
        }

        const response2 = await axios.get(
          `http://localhost:4000/tourist/getCurrency/${currencyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        setUserPreferredCurrency(response2.data)
        if (
          response.data.currentPromoCode &&
          response.data.currentPromoCode.code
        ) {
          await handlePromoSubmit({ preventDefault: () => {} })
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }
  }

  //sam here, you can use this useeffect to check if the sessionID is valid but I am gonna do it l8r <3
  // useEffect(() => {
  //   const checkPaymentStatus = async () => {
  //     const sessionId = searchParams.get("session_id")
  //     if (sessionId) {
  //       try {
  //         const response = await axios.get(`http://localhost:4000/check-payment-status?session_id=${sessionId}`)
  //         if (response.data.status === "complete") {
  //           setPaySuccess(true)
  //           await completePurchase(form.getValues())
  //         }
  //       } catch (error) {
  //         console.error("Error checking payment status:", error)
  //       }
  //     }
  //   }


  //   checkPaymentStatus()
  //   fetchCart()
  // }, [searchParams])


  useEffect(() => {
    const checkPaymentStatus = async () => {
      const sessionId = searchParams.get("session_id")
      const success = searchParams.get("success")
      const deliveryType = searchParams.get("deliveryType")
      const deliveryTime = searchParams.get("deliveryTime")

      console.log("Session ID:", sessionId)
  
      if (sessionId && success === "true") {
        try {
          const response = await axios.get(`http://localhost:4000/check-payment-status?session_id=${sessionId}`)

          console.log("Payment status response:", response.data)

          if (response.data.status === "paid") {
            setPaySuccess(true)
            setDeliveryType(deliveryType)
            setDeliveryTime(deliveryTime)
            setPaymentMethod("credit_card")

            console.log("Completing purchase...")
            await completePurchase({
              deliveryType,
              deliveryTime,
              paymentMethod: "credit_card"
            })

            console.log("Purchase completed.")
          }
        } catch (error) {
          console.error("Error checking payment status:", error)
        }
      }
    }
  
    checkPaymentStatus()
    fetchCart()
  }, [searchParams])


  const completePurchase = async (data) => {
    try {
      const token = Cookies.get("jwt")
      const response = await fetch("http://localhost:4000/tourist/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          products: cartItems.map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
          })),
          totalAmount,
          paymentMethod: data.paymentMethod === "credit_card" ? data.paymentMethod : paymentMethod,
          shippingAddress: selectedAddress,
          locationType: selectedAddress.locationType,
          deliveryType: data.paymentMethod === "credit_card" ? data.deliveryType : deliveryType,
          deliveryTime: data.paymentMethod === "credit_card" ? data.deliveryTime : deliveryTime,
          promoCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message)
      }

      setPurchaseStatus("success")
      setIsStatusDialogOpen(true)
      emptyCart();
      setRedirect(null);
    } catch (error) {
      console.error("Error completing purchase:", error)
      setPurchaseStatus("error")
      setIsStatusDialogOpen(true)
    }
  }


  const fetchCart = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await axios.get("http://localhost:4000/tourist/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCartItems(response.data || [])
      calculateTotal(response.data)
    } catch (error) {
      console.error("Error fetching cart:", error)
    }
  }

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0)
    setTotalAmount(total)
  }

  const handlePromoSubmit = async (e) => {
    if (e) e.preventDefault()
    setPromoError("")
    setPromoDetails(null)
    setDiscountAmount(0)
    setDiscountedTotal(totalAmount)

    if (!promoCode.trim()) {
      return
    }

    try {
      const response = await fetch(
        "http://localhost:4000/tourist/get/promo-code",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Cookies.get("jwt")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: promoCode }),
        }
      )

      if (response.status === 404) {
        setPromoError("Promo Code Not Found.")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch promo code details")
      }

      const data = await response.json()
      const promo = data.promoCode

      if (promo.status === "inactive") {
        setPromoError("This promo code is currently inactive.")
        return
      }

      const currentDate = new Date()
      const startDate = new Date(promo?.dateRange?.start)
      const endDate = new Date(promo?.dateRange?.end)

      if (currentDate < startDate || currentDate > endDate) {
        setPromoError("This promo code is not valid for the current date.")
        return
      }

      if (promo.timesUsed >= promo.usage_limit) {
        setPromoError("This promo code has reached its usage limit.")
        return
      }

      setPromoDetails(promo)
      const discount = totalAmount * (promo.percentOff / 100)
      setDiscountAmount(discount)
      setDiscountedTotal(totalAmount - discount)
    } catch (error) {
      console.error(error)
      setPromoError("Failed to apply promo code. Please try again.")
    }
  }

  const handleAddNewAddress = async (newAddress) => {
    setIsLoading(true)
    try {
      const token = Cookies.get("jwt")
      const response = await axios.post(
        "http://localhost:4000/tourist/addAddress",
        newAddress,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 200) {
        const userResponse = await axios.get("http://localhost:4000/tourist/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const newAddresses = userResponse.data.shippingAddresses || []
        setSavedAddresses(newAddresses)

        const addedAddress = newAddresses.find(
          (addr) =>
            addr.streetName === newAddress.streetName &&
            addr.streetNumber === newAddress.streetNumber
        )
        if (addedAddress) {
          setSelectedAddress(addedAddress)
          Object.keys(addedAddress).forEach((key) => {
            if (key !== "default") {
              form.setValue(key, addedAddress[key])
            }
          })
        }

        setIsAddressDialogOpenDetail(false)
      }
    } catch (error) {
      console.error("Error adding new address:", error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleStripeRedirect = async () => {
    try {
      console.log("Redirecting to Stripe...")
      setRedirect("Redirecting to Stripe...");

      const API_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      const stripe = await loadStripe(API_KEY)

      const response = await fetch("http://localhost:4000/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product: {
              name: item.product.name,
            },
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })),
          currency: userPreferredCurrency.code,
          deliveryInfo: {
            type: deliveryType,
            time: deliveryTime,
            deliveryPrice: getDeliveryPrice(deliveryType),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server response:", errorData)
        throw new Error(`Failed to create checkout session: ${errorData.error || response.statusText}`)
      }

      const { id: sessionId } = await response.json()

      if (!sessionId) {
        throw new Error("No session ID returned from the server")
      }

      console.log("Session ID received:", sessionId)

      const result = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (result.error) {
        console.error("Stripe redirect error:", result.error)
        throw new Error(result.error.message)
      }
    } catch (error) {
      console.error("Error in redirecting to Stripe:", error)
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  }

  const onSubmit = async () => {
    if (!deliveryType || !deliveryTime || !paymentMethod) {
      alert("Please select delivery type, delivery time, and payment method before proceeding.")
      return
    }

    if (paymentMethod === "credit_card") {
      await handleStripeRedirect()
    } else {
      await completePurchase({
        paymentMethod,
        deliveryType,
        deliveryTime
      })
    }
  }

  const emptyCart = async () => {
    try {
      setCartItems([])

      const token = Cookies.get("jwt")
      const emptyCartResponse = await fetch(
        "http://localhost:4000/tourist/empty/cart",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (emptyCartResponse.ok) {
        console.log("Cart emptied successfully.")
      } else {
        console.error("Failed to empty the cart.")
      }
    } catch (error) {
      console.error("Error emptying cart items:", error)
    }
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? "" : section)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === "checkbox") {
      setAddressDetails((prev) => ({ ...prev, [name]: checked }))
    } else {
      setAddressDetails((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCardInputChange = (e) => {
    const { name, value } = e.target
    setCardDetails((prev) => ({ ...prev, [name]: value }))
  }

  const resetAddressDetails = () => {
    setAddressDetails({
      streetName: "",
      streetNumber: "",
      floorUnit: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      landmark: "",
      locationType: "",
      default: false,
    })
  }

  const resetCardDetails = () => {
    setCardDetails({
      cardNumber: "",
      expiryDate: "",
      holderName: "",
      cvv: "",
      cardType: "",
    })
  }

  const handleNextSection = (currentSection) => {
    const sections = ["personal", "address", "payment", "delivery"]
    const currentIndex = sections.indexOf(currentSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1])
    }
  }

  const calculateDeliveryDate = (deliveryType) => {
    const today = new Date()
    let estimatedDate

    switch (deliveryType) {
      case "Standard":
        estimatedDate = addBusinessDays(today, 8)
        break
      case "Express":
        estimatedDate = addBusinessDays(today, 3)
        break
      case "Next-Same":
        estimatedDate = addDays(today, 1)
        break
      case "International":
        estimatedDate = addBusinessDays(today, 21)
        break
      default:
        estimatedDate = addBusinessDays(today, 8)
    }

    setEstimatedDeliveryDate(estimatedDate)
  }

  const handleDeliveryTypeChange = (value) => {
    setDeliveryType(value)
  }


  const fetchExchangeRate = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await fetch(
        `http://localhost:4000/${userRole}/populate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base: cartItems[0]?.product.currency,
            target: userPreferredCurrency._id,
          }),
        }
      )
      const data = await response.json()

      if (response.ok) {
        setExchangeRates(data.conversion_rate)
      } else {
        console.error("Error in fetching exchange rate:", data.message)
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }
  }

  const getCurrencySymbol = async () => {
    try {
      const token = Cookies.get("jwt")
      const response = await axios.get(
        `http://localhost:4000/${userRole}/getCurrency/${cartItems[0]?.product.currency}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setCurrencySymbol(response.data)
    } catch (error) {
      console.error("Error fetching currency symbol:", error)
    }
  }

  const formatPrice2 = (price) => {
    const roundedPrice = price
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return roundedPrice
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2)
          return exchangedPrice
        }
      }
    }
  }

  const formatPrice = (price) => {
    if (isPriceLoading) {
      return (
        <div className="w-16 h-6 bg-gray-300 rounded-full animate-pulse"></div>
      )
    }
    const roundedPrice = price
    if (cartItems.length > 0) {
      if (userRole === "tourist" && userPreferredCurrency) {
        if (userPreferredCurrency._id === cartItems[0].product.currency) {
          return `${userPreferredCurrency.symbol}${roundedPrice}`
        } else {
          const exchangedPrice = (roundedPrice * exchangeRates).toFixed(2)
          return `${userPreferredCurrency.symbol}${exchangedPrice}`
        }
      } else {
        if (currencySymbol) {
          return `${currencySymbol.symbol}${roundedPrice}`
        }
      }
    }
    return `$${roundedPrice}`
  }

  const getDeliveryPrice = (deliveryType) => {
    switch (deliveryType) {
      case "Express":
        return formatPrice2(4.99)
      case "Next-Same":
        return formatPrice2(6.99)
      case "International":
        return formatPrice2(14.99)
      default:
        return formatPrice2(2.99)
    }
  }

  const calculateEstimatedDeliveryDate = (deliveryType) => {
    const today = new Date()
    switch (deliveryType) {
      case "Standard":
        return addBusinessDays(today, 8)
      case "Express":
        return addBusinessDays(today, 3)
      case "Next-Same":
        return addDays(today, 1)
      case "International":
        return addBusinessDays(today, 21)
      default:
        return addBusinessDays(today, 8)
    }
  }

  return (
      <div className="min-h-screen bg-white">
        <div className="w-full bg-[#1A3B47] py-8 top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <button 
              onClick={() => navigate("/TouristCart")}
              className="text-[#1A3B47] flex items-center hover:text-[#388A94] transition-colors"
            >
              <ArrowDown className="mr-2" />
              Back to cart
            </button>
            <h1 className="text-5xl font-bold ml-8 text-[#1A3B47]">Checkout</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px]">
            {/* Main Checkout Form */}
            <div className="space-y-8 pr-8">
              {/* User Info Section */}
              <div className="bg-white p-6 ">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-gray-400">01</span>
                  <h2 className="text-2xl font-semibold text-[#1A3B47]">User Info</h2>
                </div>
                <div className="grid grid-cols-3 gap-4 text-base">
                  <div>
                    <Label className="font-semibold text-lg text-[#1A3B47]">Name</Label>
                    <p className="mt-1 text-[#388A94]">{form.watch("firstName")} {form.watch("lastName")}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-lg text-[#1A3B47]">Email</Label>
                    <p className="mt-1 text-[#388A94]">{form.watch("email")}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-lg text-[#1A3B47]">Phone Number</Label>
                    <p className="mt-1 text-[#388A94]">{form.watch("phone")}</p>
                  </div>
                </div>
              </div>

               {/* Delivery Options Section */}
               <div className="bg-white p-6 ">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-gray-400">02</span>
                  <h2 className="text-2xl font-semibold text-[#1A3B47]">Delivery Options</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="flex bg-gray-100 items-start gap-4 p-4 border rounded-lg">
            <Checkbox
              checked={deliveryType === "Standard"}
              onCheckedChange={() => handleDeliveryTypeChange("Standard")}
              className="border-gray-400 text-[#388A94]"
            />
            <div className="flex-1">
              <Label className="font-medium text-[#1A3B47] text-base">Standard Delivery</Label>
              <p className="text-sm text-gray-400 mt-1">2–8 business days</p>
              <span className="text-[#1A3B47] font-semibold">{formatPrice(2.99)}</span>
            </div>
          </div>
          <div className="flex bg-gray-100 items-start gap-4 p-4 border rounded-lg">
            <Checkbox
              checked={deliveryType === "Express"}
              onCheckedChange={() => handleDeliveryTypeChange("Express")}
              className="border-gray-400 text-[#388A94]"
            />
            <div className="flex-1">
              <Label className="font-medium text-[#1A3B47] text-base">Express Delivery</Label>
              <p className="text-sm text-gray-400 mt-1">1–3 business days</p>
              <span className="text-[#1A3B47] font-semibold">{formatPrice(4.99)}</span>
            </div>
          </div>
                  <div className="flex bg-gray-100 items-start gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={form.watch("deliveryType") === "Next-Same"}
                      onCheckedChange={() => handleDeliveryTypeChange("Next-Same")}
                      className="border-gray-400 text-[#388A94]"
                    />
                    <div className="flex-1">
                      <Label className="font-medium text-[#1A3B47] text-base">Next Day Delivery</Label>
                      <p className="text-sm text-gray-400 mt-1">Next business day</p>
                      <span className="text-[#1A3B47] font-semibold">{formatPrice(6.99)}</span>
                    </div>
                  </div>
                  <div className="flex bg-gray-100 items-start gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={form.watch("deliveryType") === "International"}
                      onCheckedChange={() => handleDeliveryTypeChange("International")}
                      className="border-gray-400 text-[#388A94]"
                    />
                    <div className="flex-1">
                      <Label className="font-medium text-[#1A3B47] text-base">International Shipping</Label>
                      <p className="text-sm text-gray-400 mt-1">7–21 business days</p>
                      <span className="text-[#1A3B47] font-semibold">{formatPrice(14.99)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="font-medium mb-4 block text-[#1A3B47]">Delivery Time</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-100">
                    <RadioGroup value={deliveryTime} onValueChange={setDeliveryTime}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning" className="border-gray-400 text-[#388A94]" />
                  <div>
                    <Label htmlFor="morning" className="text-base font-medium text-[#1A3B47]">Morning</Label>
                    <p className="text-sm text-[#388A94]">8am - 12pm</p>
                  </div>
                </div>
              </RadioGroup>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-100">
                      <RadioGroup value={selectedDeliveryTime} onValueChange={setSelectedDeliveryTime}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="afternoon" id="afternoon" className="border-gray-400 text-[#388A94]" />
                          <div>
                            <Label htmlFor="afternoon" className="text-base font-medium text-[#1A3B47]">Afternoon</Label>
                            <p className="text-sm text-[#388A94]">12pm - 4pm</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-100">
                      <RadioGroup value={selectedDeliveryTime} onValueChange={setSelectedDeliveryTime}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="evening" id="evening" className="border-gray-400 text-[#388A94]" />
                          <div>
                            <Label htmlFor="evening" className="text-base font-medium text-[#1A3B47]">Evening</Label>
                            <p className="text-sm text-[#388A94]">4pm - 8pm</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-100">
                      <RadioGroup value={selectedDeliveryTime} onValueChange={setSelectedDeliveryTime}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="night" id="night" className="border-gray-400 text-[#388A94]" />
                          <div>
                            <Label htmlFor="night" className="text-base font-medium text-[#1A3B47]">Night</Label>
                            <p className="text-sm text-[#388A94]">8pm - 10pm</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Delivery Address Section */}
              <div className="bg-white p-6 ">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-gray-400">03</span>
                  <h2 className="text-2xl font-semibold text-[#1A3B47]">Delivery Address</h2>
                </div>
                {selectedAddress ? (
                  <div className="space-y-4">
                    <div className="">
                      <h3 className="font-bold text-lg text-[#1A3B47]">{selectedAddress.locationType}</h3>
                      <p className="text-gray-500 mt-1">
                        {selectedAddress.streetNumber} {selectedAddress.streetName},
                        <br />
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                      </p>
                      <div className="flex gap-2 mt-4 ml-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSavedAddresses(true)}
                          className="text-[#388A94] font-bold p-0 hover:bg-white"
                        >
                          Ship to a different address?
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAddressDialogOpenDetail(true)}
                          className="text-[#388A94] font-bold hover:bg-white"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAddressDialogOpen(true)}
                          className="text-[#388A94] font-bold  hover:bg-white"
                        >
                          Add New Address
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAddressDialogOpen(true)}
                    className="w-full bg-[#1A3B47] text-white hover:bg-[#388A94]"
                  >
                    Add New Address
                  </Button>
                )}
              </div>
  
             
  
              {/* Payment Method Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-bold text-gray-400">04</span>
          <h2 className="text-2xl font-semibold text-[#1A3B47]">Payment Method</h2>
        </div>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="flex items-center bg-gray-100 p-4 border rounded-lg">
            <RadioGroupItem
              value="wallet"
              id="wallet"
              className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
            />
            <Label htmlFor="wallet" className="text-base font-medium ml-4 text-[#1A3B47]">
              Wallet
            </Label>
          </div>
          <div className="flex items-center bg-gray-100 p-4 border rounded-lg">
            <RadioGroupItem
              value="cash_on_delivery"
              id="cash_on_delivery"
              className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
            />
            <Label htmlFor="cash_on_delivery" className="text-base font-medium ml-4 text-[#1A3B47]">
              Cash on Delivery
            </Label>
          </div>
          <div className="flex items-center bg-gray-100 p-4 border rounded-lg">
            <RadioGroupItem
              value="credit_card"
              id="credit_card"
              className="w-4 h-4 rounded-full border-[#5D9297] text-[#5D9297] checked:ring-[#5D9297] checked:bg-[#5D9297] focus:ring-1 focus:ring-[#5D9297]"
            />
            <Label htmlFor="credit_card" className="text-base font-medium ml-4 text-[#1A3B47]">
              Credit/Debit Card
            </Label>
          </div>
        </RadioGroup>
      </div>
            </div>
  
            {/* Order Summary */}
            <div className="bg-gray-100 min-h-full p-6 lg:sticky lg:top-0">
              <h2 className="text-2xl font-bold mb-4 text-[#1A3B47]">Order Summary ({cartItems.length})</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium text-[#1A3B47]">{item?.product?.name} x {item?.quantity}</p>
                    </div>
                    <span className="text-[#388A94] font-semibold">{formatPrice(item?.totalPrice)}</span>
                  </div>
                ))}
                <div className
  ="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-[#1A3B47]">Subtotal</span>
                    <span className="text-[#388A94] font-semibold">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[#1A3B47]">Delivery</span>
                    <span className="text-[#388A94] font-semibold" >{formatPrice(
                      form.watch("deliveryType") === "Express"
                        ? 4.99
                        : form.watch("deliveryType") === "Next-Same"
                        ? 6.99
                        : form.watch("deliveryType") === "International"
                        ? 14.99
                        : 2.99
                    )}</span>
                  </div>
                  {promoDetails && (
                    <div className="flex justify-between mt-2 text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-4 text-xl font-bold">
                    <span className="text-[#1A3B47] ">Total</span>
                    <span className="text-[#388A94]">{formatPrice(
                      (promoDetails ? discountedTotal : totalAmount) +
                      (form.watch("deliveryType") === "Express"
                        ? 4.99
                        : form.watch("deliveryType") === "Next-Same"
                        ? 6.99
                        : form.watch("deliveryType") === "International"
                        ? 14.99
                        : 2.99)
                    )}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-[#1A3B47]">
                <p className="font-medium">Estimated to be delivered on {format(calculateEstimatedDeliveryDate(form.watch("deliveryType")), 'MMMM dd')}</p>
              </div>
              <div className="mt-2 text-[#1A3B47]">
                <p className="font-medium">Delivering to {selectedAddress?.city}</p>
              </div>
              <div className="mt-6">
                <form onSubmit={handlePromoSubmit} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="border-[#1A3B47]"
                  />
                  <Button type="submit" variant="outline" className="border-[#1A3B47] text-[#1A3B47] hover:bg-[#1A3B47] hover:text-white">Apply</Button>
                </form>
                {promoError && <p className="text-red-500 mt-2">{promoError}</p>}
                {promoDetails && (
                  <p className="text-green-600 mt-2">Promo code applied successfully!</p>
                )}
              </div>
              <Button 
        className="w-full mt-6 bg-[#1A3B47] text-white hover:bg-[#388A94]" 
        size="lg"
        onClick={onSubmit}
      >
        
        {redirect == null ? "Complete Purchase" : {redirect}}      </Button>
            </div>
          </div>
        </div>
  
      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpenDetail} onOpenChange={setIsAddressDialogOpenDetail}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Address Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 bg-[#F4F4F4] rounded-b-lg">
            <p><strong className="text-[#1A3B47]">Street:</strong> {selectedAddress?.streetName} {selectedAddress?.streetNumber}</p>
            {selectedAddress?.floorUnit && <p><strong className="text-[#1A3B47]">Floor/Unit:</strong> {selectedAddress.floorUnit}</p>}
            <p><strong className="text-[#1A3B47]">City:</strong> {selectedAddress?.city}</p>
            <p><strong className="text-[#1A3B47]">State:</strong> {selectedAddress?.state}</p>
            <p><strong className="text-[#1A3B47]">Country:</strong> {selectedAddress?.country}</p>
            <p><strong className="text-[#1A3B47]">Postal Code:</strong> {selectedAddress?.postalCode}</p>
            {selectedAddress?.landmark && <p><strong className="text-[#1A3B47]">Landmark:</strong> {selectedAddress.landmark}</p>}
            <p><strong className="text-[#1A3B47]">Location Type:</strong> {selectedAddress?.locationType}</p>
          </div>
          
<DialogFooter>
            <Button onClick={() => setIsAddressDialogOpenDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Addresses Dialog */}
      <Dialog open={showSavedAddresses} onOpenChange={setShowSavedAddresses}>
      <DialogContent className="sm:max-w-[425px] dialog-content">
      <div className="space-y-4 overflow-y-auto max-h-[520px]">
                  <DialogHeader>
            <DialogTitle>Saved Addresses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4  overflow-y-auto">
            {savedAddresses.map((address, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="font-medium">{address.locationType}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {address.streetNumber} {address.streetName},
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAddress(address)
                    Object.keys(address).forEach((key) => {
                      if (key !== "default") {
                        form.setValue(key, address[key])
                      }
                    })
                    setShowSavedAddresses(false)
                  }}
                  className="mt-2"
                >
                  Select
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSavedAddresses(false)}>Close</Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}

<Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader className="flex items-center gap-2">
      {purchaseStatus === "success" ? (
        <>
          <CheckCircle className="w-6 h-6 text-green-500" />
          <DialogTitle>Purchase Successful</DialogTitle>
        </>
      ) : (
        <>
          <XCircle className="w-6 h-6 text-red-500" />
          <DialogTitle>Purchase Failed</DialogTitle>
        </>
      )}
    </DialogHeader>
    <p className="mt-2 text-gray-600">
      {purchaseStatus === "success"
        ? "Your purchase has been completed successfully."
        : "There was an error processing your purchase. Please try again."}
    </p>
    <p className="text-red-500">{purchaseError}</p>
    <DialogFooter className="mt-4">
      <Button onClick={() => setIsStatusDialogOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
<DialogContent className="sm:max-w-[425px]">
  <DialogHeader>
    <DialogTitle>Add New Address</DialogTitle>
  </DialogHeader>
  <ShippingAddress
    onCancel={() => setIsAddressDialogOpen(false)}
  />
</DialogContent>
</Dialog>
    </div>

  )
}

