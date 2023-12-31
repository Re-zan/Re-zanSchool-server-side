const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.ACCESS_STRIPE_TOKEN);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//veryfiJWT
const veryfiJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorization access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_JWT, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorization access" });
    }
    req.decoded = decoded;

    next();
  });
};

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
    const classesCollection = client.db("re-zanSchoolDB").collection("classes");
    const myclassesCollection = client
      .db("re-zanSchoolDB")
      .collection("myclasses");
    const payemtCollention = client.db("re-zanSchoolDB").collection("payments");
    //make route for jwt
    app.post("/users/jwt", (req, res) => {
      const userdata = req.body;
      const tokenCreate = jwt.sign(userdata, process.env.ACCESS_TOKEN_JWT, {
        expiresIn: "1h",
      });
      res.send(tokenCreate);
    });

    ///////////user
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

    //////admin
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

    ////////////////////////////////////////////////////////////////////////////////////////////
    // check admin
    app.get("/users/admin/:email", veryfiJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    ///////instructor
    //check instructor
    app.get("/users/instructor/:email", veryfiJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ instructor: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send({ result, user });
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

    ////////////classes

    //add class
    app.post("/classes", async (req, res) => {
      const classesDatas = req.body;
      const result = await classesCollection.insertOne(classesDatas);
      res.send(result);
    });
    //get classes
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });
    app.get("/getclasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });
    //get classes by instructor
    app.get("/classes/:email", async (req, res) => {
      const result = await classesCollection
        .find({ instructor_email: req.params.email })
        .toArray();

      res.send(result);
    });
    //feedbackSet
    app.put("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const feedbackData = data.feedback;
      const updateData = {
        $set: {
          feedBack: feedbackData,
        },
      };
      const result = await classesCollection.updateOne(filter, updateData);
      res.send(result);
    });
    //approved
    app.patch("/classes/approved/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updata = {
        $set: {
          status: "approved",
        },
      };
      const result = await classesCollection.updateOne(filter, updata);
      res.send(result);
    });
    //dniyed
    app.patch("/classes/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updata = {
        $set: {
          status: "dined",
        },
      };
      const result = await classesCollection.updateOne(filter, updata);
      res.send(result);
    });
    /////////////////////

    ////////////reviews data
    //parent reviews data get
    app.get("/parentReviews", async (req, res) => {
      const result = await parentReviewCollention.find().toArray();
      res.send(result);
    });

    //////news data

    //news data get from server side
    app.get("/news", async (req, res) => {
      const result = await newsCollection.find().sort({ date: -1 }).toArray();
      res.send(result);
    });
    ///////////////// student
    app.get("/my_classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await myclassesCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/my_classes", async (req, res) => {
      const datas = req.body;
      const result = await myclassesCollection.insertOne(datas);
      res.send(result);
    });

    app.delete("/my_classes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myclassesCollection.deleteOne(query);
      res.send(result);
    });

    /////////////////////////////
    //////////payment

    app.post("/create-payment-inteten", async (req, res) => {
      const { price } = req.body;
      amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // //payment
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const insertResult = await payemtCollention.insertOne(payment);
      res.send(insertResult);
    });
    ///////////////////////////
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
