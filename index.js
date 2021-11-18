const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.10dvn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('bikeMountain');
        const productsCollection = database.collection('products');
        const userCollection = database.collection('users')
        const userCollectionRatting = database.collection('ratting')
        const orderCollection = database.collection('orders')

        // GET API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const product = await cursor.toArray();
            res.send(product)
        })

        // GET single products
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            console.log(req.params)
            const product = await productsCollection.findOne(query)
            res.send(product)
        })

        // Order send to server
        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.status = 'pending';
            const result = await orderCollection.insertOne(order)
            console.log(result);
            res.json(result)
        });


        app.put('/modified/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            console.log(req.params)
            const options = { upsert: true }
            const updatedDoc = {
                $set: { status: 'approved' }
            }
            const result = await orderCollection.updateOne(query, updatedDoc, options);
            res.json(result)
        });



        // GET all orders
        app.get('/allorders', async (req, res) => {
            const cursor = orderCollection.find({});
            const product = await cursor.toArray();
            res.send(product)
        })




        // get orders based on user email.
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders)
        });


        /// delete order

        app.delete("/deleteOrder/:id", async (req, res) => {
            console.log(req)

            const result = await orderCollection.deleteOne({ _id: ObjectId(req.params.id) });
            console.log(req.params.id)
            res.send(result);
        });



        // Status update
        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updatedUser.name,
                    note: updatedUser.note
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        // delete user order using id 
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result);
        });




        // POST API
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            console.log(result)
            res.json(result)
        });

        // DELETE product API
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result)

        })

        // RATING sent to server
        app.post('/ratting', async (req, res) => {
            const ratting = req.body;
            const result = await userCollectionRatting.insertOne(ratting);
            res.json(result);
        });
        // Rating get to UI
        app.get('/ratting', async (req, res) => {
            const cursor = userCollectionRatting.find({});
            const ratting = await cursor.toArray();
            res.json(ratting);
        });

        // GET admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // POST user 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.json(result)
            console.log(result)
        });

        // UPDATE user role
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result)
        });

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello Mountain bike server')
})

app.listen(port, () => {
    console.log(`Listening at ${port}`)
})