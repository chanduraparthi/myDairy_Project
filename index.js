const express=require('express');
const cors=require('cors');
const bcrypt=require('bcrypt');
const mysql=require('mysql2');

const app=express();

// In-memory storage for users (replace with database later)
const users = [];

const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'chandU!26012005',
    database:'myDairy'
});

connection.connect((err) => {
    if(err) {
        console.log('Error connecting to the Databas:',err);
        return;
    }
    console.log('Connected to Mysql Database');
});

app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.get('/',(req,res) => {
    console.log(req)
    res.status(200).json({message:'Successful'})
})



app.post('/registerUser', async (req,res) => {
    console.log('Registration request:', req.body);
    const {email,password}=req.body

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        //Hashpassword
        const hashedPassword = await bcrypt.hash(password,10);
        // MINIMAL (but insecure) fix — shows exact placement fix


        // Store user in memory
        users.push({ email, password: hashedPassword });

        //Log the data (you can store this in db later)
        console.log('user Data:', {
            email,
            hashedPassword
        });

        // Insert into database
        connection.query(
            `INSERT INTO Users(EmailID,HashedPassword) VALUES (?, ?)`,
            [email, hashedPassword],
            (err, results) => {
                if (err) {
                    console.log('Database insert error:', err);
                    return res.status(500).send('Database error');
                }
                res.status(200).send('Registration successful');
            }
        );
    } catch(err) {
        console.log('Hashing error:', err);
        res.status(500).send('Error while hashing the password');
    }
})


app.post('/userLogin', async (req, res) => {
    console.log("User logged in: ", req.body);
    const { email, password } = req.body;
    connection.query(
        `SELECT ID, HashedPassword FROM Users WHERE EmailID = ?`,
        [email],
        async (err, result) => {
            if (err) {
                console.log('Database query error:', err);
                res.status(500).send('Database error');
                return;
            }
            if (result.length === 0) {
                res.status(401).send('Invalid email or password');
                return;
            }
            const hashedPassword = result[0].HashedPassword;
            const userID = result[0].ID;
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (isMatch) {
                res.status(200).json({ userID: userID });
            } else {
                res.status(401).send('Invalid email or password');
            }
        }
    );
})



    app.post('/newPost', async (req, res) => {
        const { postTitle, postDescription, userID } = req.body;
        connection.query(
            `INSERT INTO Posts(UserID, postTitle, postDescription) VALUES (?, ?, ?)`,
            [userID, postTitle, postDescription],
            (err, result) => {
                if (err) {
                    console.log('Database insert error:', err);
                    res.status(500).send('Database error');
                    return;
                }
                console.log("New post created:", req.body);
                res.status(200).send('Post created successfully');
            }
        );
    })

    app.get('/getMyPosts', async (req, res) => {
        connection.query(
            `SELECT * FROM Posts WHERE UserID = ?`,
            [req.query.userID],
            (err, result) => {
                if (err) {
                    console.log('Database query error:', err);
                    res.status(500).send('Database error');
                    return;
                }
                res.status(200).json(result);
            }
        );
    })

app.listen(3000,()=> {
    console.log('Server is started on post 3000');
})
