// Add this utility function
const formatPhoneNumber = (phone) => {
    // Remove non-digit characters
    let cleanedPhone = phone.replace(/\D/g, '');

    if (cleanedPhone.startsWith('0')) {
        // Replace leading '0' with '254'
        return '254' + cleanedPhone.substring(1);
    } else if (cleanedPhone.startsWith('+254')) {
        // Remove leading '+'
        return cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('254')) {
        // If 9 digits (e.g., 7XXXXXXXX) prepend '254'
        return '254' + cleanedPhone;
    } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('254')) {
        // Already in correct 2547XXXXXXXX format
        return cleanedPhone;
    }

    // Return original if none of the standard formats match (will likely fail)
    return cleanedPhone;
};

export default formatPhoneNumber;