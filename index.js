const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb start
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USERPASSWORD}@cluster0.6wlkevy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    //project start here

    //collentions
    const parentReviewCollention = client
      .db("re-zanSchoolDB")
      .collection("parents_reviews");
    const newsCollection = client.db("re-zanSchoolDB").collection("news");
    const userCollection = client.db("re-zanSchoolDB").collection("user");

    //get all user data
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });
    //users
    app.post("/users", async (req, res) => {
      const userData = req.body;
      const query = { email: userData.email };
      const existing = await userCollection.findOne(query);
      if (existing) {
        return res.send("You are already loggedIn");
      }
      const result = await userCollection.insertOne(userData);
      res.send(result);
    });

    //make admin
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      userData = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, userData);
      res.send(result);
    });

    //make instructor
    app.put("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      userData = {
        $set: {
          role: "instructor",
        },
      };

      const result = await userCollection.updateOne(filter, userData);
      res.send(result);
    });

    //parent reviews data get
    app.get("/parentReviews", async (req, res) => {
      const result = await parentReviewCollention.find().toArray();
      res.send(result);
    });

    //news data get from server side
    app.get("/news", async (req, res) => {
      const result = await newsCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//testing
app.get("/", (req, res) => {
  res.send("all the datas are on the way");
});

//connect
app.listen(port);
