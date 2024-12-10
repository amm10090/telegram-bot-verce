// api/test.js
export default function handler(request, response) {
    console.log('Test endpoint hit');
    return response.status(200).json({ message: 'Test endpoint working' });
}