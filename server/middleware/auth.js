const { user } = require("../sequelize/models");
const config = require("../config/config").get(process.env.NODE_ENV);
const jwt = require("jsonwebtoken");

let auth = (req, res, next) => {
  let token = req.cookies.auth;
  jwt.verify(token, config.SECRET, async function(err, decoded) {
    if(err) return next(err);
    const find = await user.findOne({where:{ _id: decoded, token: token }})
    if (!find) return res.status(401).json({ error: true, message: "Unauthorized" });
    req.token = token;
    req.user = find;
    next();
  });
};

let authRole = () =>{
  return (req, res, next)=>{
    if(!req.user.role){
      res.status(401)
      return res.json({message:"Not Allowed!"});
    }
    next();
  }
}

module.exports = { auth, authRole };
