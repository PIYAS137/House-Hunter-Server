
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();

        // Database & Collections 
        const userCollection = client.db("HouseHunterDatabase").collection('userCollection');
        const houseCollection = client.db("HouseHunterDatabase").collection("houseCollection");
        const requestCollection = client.db("HouseHunterDatabase").collection("requestCollection");



        // Create User (SIGNUP) API ========================================= >>>>>
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

        // Check User (LOGIN) API ========================================== >>>>>>
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

        // Add new House API ================================================ >>>>>>
        app.post('/item', async (req, res) => {
            const data = req.body;
            const result = await houseCollection.insertOne(data);
            res.send(result);
        })

        // Get All Houses API =============================================== >>>>>>
        app.get('/item', async (req, res) => {
            const result = await houseCollection.find({}).toArray();
            res.send(result);
        })

        // Get One Houses Details API ======================================= >>>>>>
        app.get('/item/:sid', async (req, res) => {
            const id = req.params.sid;
            const query = { _id: new ObjectId(id) };
            const result = await houseCollection.findOne(query);
            res.send(result);
        })

        // Delete One Houses API ======================================= >>>>>>
        app.delete('/item/:sid', async (req, res) => {
            const id = req.params.sid;
            const query = { _id: new ObjectId(id) };
            const result = await houseCollection.deleteOne(query);
            res.send(result);
        })

        // Update One Houses API ======================================= >>>>>>
        app.put('/item/:sid', async (req, res) => {
            const id = req.params.sid;
            const query = { _id: new ObjectId(id) };
            const data = req.body;
            data._id = new ObjectId(data._id); //convert string to new ObjectId
            const updatedDoc = {
                $set: {
                    name: data?.name,
                    address: data?.address,
                    city: data?.city,
                    bedroom: data?.bedroom,
                    size: data?.size,
                    image: data?.image,
                    date: data?.date,
                    price: data?.price,
                    phone: data?.phone,
                    describe: data?.describe,
                    _id: data?._id,
                    create: data?.create,
                    email: data?.email,
                    status: data?.status
                }
            }
            const result = await houseCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        // Get Owners added Houses API ====================================== >>>>>>
        app.get('/owner', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const result = await houseCollection.find(query).toArray();
            res.send(result);
        })

        // Make a request =================================================== >>>>>>>
        app.post('/request', async (req, res) => {
            const data = req.body;
            const userQuery = { userEmail: data.userEmail };
            var totalReq = await requestCollection.find(userQuery).toArray();
            totalReq = totalReq.filter(one=>one.reqStatus !== 'deleted');  // Im not counting the delted req here !
            if (totalReq.length < 2) {
                data.houseId = new ObjectId(data.houseId);
                const idQuery = { houseId: data.houseId, userEmail: data.userEmail };
                const isExist = await requestCollection.findOne(idQuery);
                if (isExist) {
                    res.send({ flag: -1 }) // already make request for this home !
                } else {
                    const result = await requestCollection.insertOne(data);
                    res.send(result);
                }
            } else {
                res.send({ flag: 1 }) // this user already make request for 2 home !
            }
        })

        // Get Ranter added Houses API ====================================== >>>>>>
        app.get('/ranter', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email };
            const result = await requestCollection.find(query).toArray();
            res.send(result);
        })

        // Delete Ranter request Houses API ====================================== >>>>>>
        app.delete('/ranter/:sid', async (req, res) => {
            const id = req.params.sid;
            const query = {_id : new ObjectId(id)};
            const result = await requestCollection.deleteOne(query);
            res.send(result);
        })

        // Get an Owners House Req API =========================================== >>>>>>
        app.get('/request',async(req,res)=>{
            const email = req.query?.email;
            const query = { ownerEmail : email };
            const result = await requestCollection.find(query).toArray();
            res.send(result);
        })

        // req delete related API ================================================ >>>>>>
        app.patch('/request/:sid',async(req,res)=>{
            const id = req.params.sid;
            const query = {_id : new ObjectId(id)};
            const updatedDoc = {
                $set:{
                    reqStatus : 'deleted'
                }
            }
            const result = await requestCollection.updateOne(query,updatedDoc);
            res.send(result);
        })

        // req accept by owner API ============================================== >>>>>>>
        app.put('/request',async(req,res)=>{
            const data = req.body;
            const homeQuery = {_id : new ObjectId(data?.homeId)};
            const reqQuery = {_id : new ObjectId(data?.reqId)};
            try{
                const updatedDocForHome = {$set:{status : true}}
                const HomeRes = await houseCollection.updateOne(homeQuery,updatedDocForHome);
                if(HomeRes.modifiedCount >0){
                    const updatedDocForReq = {$set:{reqStatus : 'accepted'}}
                    const ReqRes = await requestCollection.updateOne(reqQuery,updatedDocForReq);
                    res.send(ReqRes);
                }
            }catch(err){
                res.send(err.message);
            }
        })

        
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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