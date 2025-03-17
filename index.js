const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT | 3000;

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6mmiv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });


    const newArriveCollection = client.db("bazar").collection("newArrive");
    const userCollection = client.db("bazar").collection("users");
    const allPhoneCollection = client.db("bazar").collection("allPhones");
    const allLaptopCollection = client.db("bazar").collection("allLaptops");
    const allBluetoothCollection = client.db("bazar").collection("allBluetooths");

     // jwt verify middleware
     const verifyToken = (req, res, next) => {
        // console.log("this is a verify token", req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({ message: "Unauthorized access" });
        }
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: "unauthorized access" });
          }
          req.decoded = decoded;
          next();
        });
      };

     // verifyAdmin token
     const verifyAdmin = async (req, res, next) => {
        const email = req?.decoded?.email;
        // console.log('this is a email', email);
        const query = { email: email };
        // console.log('this is a query', query);
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === "admin";
        // console.log(isAdmin);
        if (!isAdmin) {
          return res.status(403).send({ message: "forbidden access" });
        }
        next();
      };  


    // admin api
    app.get("/users/admin/:email", verifyToken, verifyAdmin, async(req, res) => {
        const email = req.params.email;
        if(email !== req.decoded.email){
            return res.status(403).send({message: "Unauthorized access"})
        }
        const query = {email: email};
        const user = await userCollection.findOne(query);
        let admin = false;
        if(user){
            admin = user?.role === "admin"
        }
        res.send({admin});
    })  

    app.post("/jwt", async(req, res) => {
        const user = req.body;
        const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "365d"
        })
        res.send({token});
    })

    // all user apis
    app.post("/users",  async (req, res) => {
        const user = req.body;
        const query = { email: user.email };
        const isExist = await userCollection.findOne(query);
        if (isExist) return res.send(isExist);
        const result = await userCollection.insertOne({ ...user, role: "user" });
        res.send(result);
      });

    // get all user data
    app.get("/users", verifyToken, async (req, res) => {
        const result = await userCollection.find().toArray();
        res.send(result);
    });

    // delete user by admin
    app.delete("/users/:id", async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await userCollection.deleteOne(query);
        res.send(result)
    });

    // make a user admin
    app.patch("/users/admin/:id", async(req, res) => {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const updateDoc = {
            $set: {
                role: "admin"
            }
        }
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result)
    })

    // get all the new arrive data
    app.get("/new-arrive", async(req, res) =>{
        const result = await newArriveCollection.find().toArray();
        res.send(result);
    });


  // add phone data to database
  app.post("/addPhones", async (req, res) => {
    const addPhones = req.body;
    const result = await allPhoneCollection.insertOne(addPhones);
    res.send(result);
  }); 

  // add laptop data to database
  app.post("/addLaptops", async (req, res) => {
    const addLaptops = req.body;
    const result = await allLaptopCollection.insertOne(addLaptops);
    res.send(result);
  });

  // add bluetooth data to database
  app.post("/addBluetooth", async (req, res) => {
    const addBluetooth = req.body;
    const result = await allBluetoothCollection.insertOne(addBluetooth);
    res.send(result);
  }); 


  // show phone data into a admin panel
  app.get("/phones", async(req, res) => {
    const result = await allPhoneCollection.find().toArray();
    res.send(result);
  });

  // show laptop data into a admin panel
  app.get("/laptops", async(req, res) => {
    const result = await allLaptopCollection.find().toArray();
    res.send(result);
  });

  // show bluetooth data into a admin panel
  app.get("/bluetooths", async(req, res) => {
    const result = await allBluetoothCollection.find().toArray();
    res.send(result);
  });


  // phone details page by dynamic id
  app.get("/phoneDetails/:id", async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await allPhoneCollection.findOne(query);
    res.send(result);
  });

  // laptop details page by dynamic id
  app.get("/laptopDetails/:id", async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await allLaptopCollection.findOne(query);
    res.send(result);
  });

  // bluetooth details page by dynamic id
  app.get("/bluetoothDetails/:id", async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await allBluetoothCollection.findOne(query);
    res.send(result);
  })




    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("bazar is on");
})

app.listen(port, () => {
    console.log(`bazar is on: ${port}`)
})