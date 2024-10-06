import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Mail, Phone, User, CheckCircle, AtSign } from "lucide-react";

export function SellerProfileComponent() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSeller, setEditedSeller] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});

  const getUserRole = () => {
    let role = Cookies.get("role");
    if (!role) role = "guest";
    return role;
  };

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const token = Cookies.get("jwt");
        const role = getUserRole();

        const api = `http://localhost:4000/${role}`;
        const response = await axios.get(api, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSeller(response.data);
        setEditedSeller(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedSeller((prev) => ({ ...prev, [name]: value }));
    setValidationMessages((prev) => ({ ...prev, [name]: "" })); // Clear validation message on change
  };

  const validateFields = () => {
    const { name, username, email, mobile, description } = editedSeller;
    const messages = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex for email validation

    if (!name) messages.name = "Name is required.";
    if (!username) messages.username = "Username is required.";
    if (!email) {
      messages.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      messages.email = "Invalid email format.";
    }
    if (!mobile) {
      messages.mobile = "Phone number is required.";
    } else if (mobile.length < 11) {
      messages.mobile = "Phone number must be at least 11 characters.";
    }
    if (!description) messages.description = "Description is required.";

    setValidationMessages(messages);
    return Object.keys(messages).length === 0; // Return true if no messages
  };

  const handleUpdate = async () => {
    if (!validateFields()) {
      return; // If validation fails, do not proceed
    }

    try {
      const token = Cookies.get("jwt");
      const role = getUserRole();

      const api = `http://localhost:4000/${role}/${seller._id}`;
      const response = await axios.put(api, editedSeller, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSeller(response.data.seller);
      setIsEditing(false);
      setError(""); // Clear previous errors
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">No seller profile information is available.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-32 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-white">
  <User className="w-12 h-12 text-white" /> {/* Adjust the size of the icon here */}
</div>

         
          <div>
            {/* Name - Displayed above the username */}
            {isEditing ? (
              <div className="mb-4">
                <input
                  type="text"
                  name="name"
                  value={editedSeller.name}
                  onChange={handleInputChange}
                  className={`text-3xl font-bold mb-1 border rounded px-2 py-1 ${
                    validationMessages.name ? "border-red-500" : ""
                  }`}
                  placeholder="Full Name"
                />
                {validationMessages.name && (
                  <span className="text-red-500 text-sm">{validationMessages.name}</span>
                )}
              </div>
            ) : (
              <h2 className="text-3xl font-bold mb-1">{seller.name}</h2>
            )}

            {/* Username - with icon */}
            <div className="flex items-center gap-2 mb-4">
              <AtSign className="w-4 h-4 text-gray-500" />
              {isEditing ? (
                <div className="flex flex-col">
                  <input
                    type="text"
                    name="username"
                    value={editedSeller.username}
                    onChange={handleInputChange}
                    className={`text-2xl font-semibold border rounded px-2 py-1 flex-1 ${
                      validationMessages.username ? "border-red-500" : ""
                    }`}
                    placeholder="Username"
                  />
                  {validationMessages.username && (
                    <span className="text-red-500 text-sm">{validationMessages.username}</span>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-semibold">{seller.username}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedSeller.email}
                  onChange={handleInputChange}
                  className={`border rounded px-2 py-1 flex-1 ${
                    validationMessages.email ? "border-red-500" : ""
                  }`}
                  placeholder="Email"
                />
              ) : (
                <span>{seller.email}</span>
              )}
            </div>
            {validationMessages.email && (
              <span className="text-red-500 text-sm">{validationMessages.email}</span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              {isEditing ? (
                <input
                  type="text"
                  name="mobile"
                  value={editedSeller.mobile}
                  onChange={handleInputChange}
                  className={`border rounded px-2 py-1 flex-1 ${
                    validationMessages.mobile ? "border-red-500" : ""
                  }`}
                  placeholder="Phone Number"
                />
              ) : (
                <span>{seller.mobile}</span>
              )}
            </div>
            {validationMessages.mobile && (
              <span className="text-red-500 text-sm">{validationMessages.mobile}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>{seller.sellerType}</span>
          </div>

          <div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                seller.isAccepted ? "bg-green-100 text-green-800 text-lg" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <CheckCircle className="inline w-4 h-4 mr-1" />
              {seller.isAccepted ? "Account Accepted" : "Account Pending"}
            </span>
          </div>
        </div>

        {(seller.description || isEditing) && (
          <div className="flex flex-col">
            <h3 className="font-semibold mb-2">Description</h3>
            {isEditing ? (
              <div>
                <textarea
                  name="description"
                  value={editedSeller.description}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-2 py-1 ${
                    validationMessages.description ? "border-red-500" : ""
                  }`}
                  rows="3"
                  placeholder="Description"
                />
                {validationMessages.description && (
                  <span className="text-red-500 text-sm">{validationMessages.description}</span>
                )}
              </div>
            ) : (
              <p className="text-gray-600">{seller.description}</p>
            )}
          </div>
        )}

        <div className="mt-6">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
