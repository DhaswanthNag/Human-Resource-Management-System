const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const offerLetterAPI = {
  // Get all offers
  getOffers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
  },

  // Get single offer by ID
  getOfferById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch offer');
      return await response.json();
    } catch (error) {
      console.error('Error fetching offer:', error);
      throw error;
    }
  },

  // Create new offer
  createOffer: async (offerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return await response.json();
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  },

  // Update offer
  updateOffer: async (id, offerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to update offer');
      return await response.json();
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  },

  // Delete offer
  deleteOffer: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete offer');
      return await response.json();
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  },

  // Send email with offer letter
  sendEmail: async (emailData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offers/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) throw new Error('Failed to send email');
      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
};