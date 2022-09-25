const { auth, authRole } = require("../middleware/auth");
const express = require("express");
const config = require("../config/config").get(process.env.NODE_ENV);
const app = express.Router();
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const Op = require('Sequelize').Op;

//model
const { user } = require('../sequelize/models');

app.get("/api/auth", auth, async (req, res) => {
  res.send({
    isAuth: true,
    id: req.user._id,
    email: req.user.email,
    nickname: req.user.nickname
  });
});

app.post("/api/register", async (req, res) => {
  try {
    let { nickname, email, password, role, phoneNumber } = req.body

    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    await user.create({nickname,email,password:hash, role, phoneNumber});

    res.status(200).send({ message: "Registration Done!" })
  } catch (error) {
    const msg = error.errors?error.errors[0].message:null;
    if(msg){
      return res.status(400).send({message:msg});
    }
    res.status(500).send({message:error.message});
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const u = await user.findOne({ where: { email: req.body.username } })
    if (!u)
      return res.status(400).json({
        isAuth: false,
        message: "Auth Failed {Email not Found}"
      });
    if (u) {
      const isMatch = bcrypt.compareSync(req.body.password, u.password);
      if (!isMatch)
        return res.status(400).json({
          isAuth: false,
          message: "Auth Failed {Wrong Password}"
        });

      var token = jwt.sign(u._id, config.SECRET);
      u.token = token;
      u.save()
      res.cookie("auth", u.token).send({
        isAuth: true,
        id: u._id,
        email: u.email
      });
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error.message });
  }
});

app.get("/api/logout", auth, async (req, res) => {
  try {
    console.log(req.cookies.auth)
    let admin = await user.findOne({ where: { token: req.cookies.auth } });
    admin.token = null
    admin.save();
    res.status(200).send({ message: 'User Logged out' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

//update user phone Number
app.patch("/api/users", auth ,async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const id = req.user.dataValues._id;

    const isPhoneNumber = phoneNumber.match(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/);

    if(!isPhoneNumber){
      return res.status(400).json({message:"Please Enter Valid Phone Number!"});
    }
    
    let data = await user.findOne({where:{_id: id}});
    data.phoneNumber = phoneNumber;
    await data.save();
    
    res.json({message:"User Info Updated!"});
  } catch (error) {
    console.log(error);
    res.status(500).send({message:error})
  }
});

///////////////////////////////////////////////////////Admin access only///////////////////////////////////////////////////

//get user by name or email
app.get("/api/user", auth , authRole() ,async (req, res) => {
  try {
    const {username} = req.body;

    const data = await user.findOne({
      where: {
        [Op.or]: [{nickname: username}, {email: username}]
      }
    });

    if(!data){
      return res.status(400).json({message:"Not Found!", data})
    }
    return res.status(200).send({message:"Found" , data})
  } catch (error) {
    return res.status(500).send({message:error.message})
  }
});

//delete User
app.delete("/api/user", auth, authRole() , async(req, res)=>{
  try {
    const {id} = req.query;
    const data = await user.findOne({where:{_id: id}});
    if(!data) return res.status(400).json({msg:"User Not Found!"});
    await data.destroy();
    res.json({msg:"User has been Deleted!"});
  } catch (error) {
    return res.status(400).send({message:error.message})
  }
})


///////////////////////////////////////////////////////GLOBAL Asscess API//////////////////////////////////////////////////////

//get all users
app.get("/api/allusers",async (req, res) => {
  try {
    const data = await user.findAll();
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send({message:error.message});
  }
});



module.exports = app;
