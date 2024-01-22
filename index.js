
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5022;
require('dotenv').config()


// middlewares =========== >>>>>
app.use(express.json());
app.use(cors());
// middlewares =========== >>>>>

// ======================================= MONGO DB =========================================//

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.frg7rqf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        // Database & Collections 
        const userCollection = client.db("HouseHunterDatabase").collection('userCollection');



        // Create User (SIGNUP) API ============ >>>>>
        app.post('/user', async (req, res) => {
            const data = req.body;
            const query = { email: data?.email };
            const exist = await userCollection.findOne(query);
            if (exist) {
                res.send({ flag: -1 })
            } else {
                const result = await userCollection.insertOne(data);
                res.send(result);
            }
        })

        // Check User (LOGIN) API
        app.put('/user', async (req, res) => {
            try {
                const data = req.body;
                const query = { email: data.email, pass: data.pass };
                const result = await userCollection.findOne(query);
                if (result == null) {
                    res.send({ flag: -1 })
                }
                res.send(result);
            } catch (err) {
                console.log(err);
            }
        })









        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
// ======================================= MONGO DB =========================================//




















app.get('/', (req, res) => {
    res.send("Server is Running . . . !");
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})