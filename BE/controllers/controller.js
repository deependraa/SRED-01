import mongoose from "mongoose";

export const getCollections = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.status(200).json(collections.map(col => col.name));
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ message: 'Error fetching collections', error });
    }
}


export const dynamicSearchAndFilter = async (req, res) => {
    const { collectionName, filters, search } = req.body;

    try {
        const collection = mongoose.connection.db.collection(collectionName);
        const query = {};

        // Apply filters
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                query[key] = value;
            });
        }

        // Apply search
        if (search) {
            query.$text = { $search: search };
        }

        const results = await collection.find(query).toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ message: 'Error in search', error });
    }
}