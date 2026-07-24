import brcypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = '60m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;


export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res
        .status(400)
        .json({
          message:
            "Khong the thieu username, password, email, firstName, lastName",
        });
    }

    //kiem tra user da ton tai chua
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      return res.status(409).json({ message: "Username da ton tai" });
    }
    //ma hoa password
    const hashedPassword = await brcypt.hash(password, 10); //salt = 10

    //tao user moi
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });
    //return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Loi khi goi signUp", error);
    return res.status(500).json({ message: "Loi he thong" });
  }
};

export const signIn = async (req, res) => {
    try {
        //lay input
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Thieu username hoac password" });
        }
        //lay hashedPassword trong db so voi password tu input
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Username hoac password khong dung" });
        }
        //kiem tra password
        const passwordCorrect = await brcypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Username hoac password khong dung" });
        }

        //neu khop tao accessToken voi JWT
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL} );
        //tao refreshToken 
        const refreshToken = crypto.randomBytes(64).toString('hex');
        //tao session trong db voi refreshToken
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });
        //tra refreshToken ve trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        });
        //tra access Token ve res
        return res.status(200).json({message : `User ${user.displayName} da logged in`, accessToken});
    } catch (error) {
        console.error("Loi khi goi signIn", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};

export const signOut = async (req, res) => {
    try {
        //lay refreshToken tu cookie
        const token = req.cookies?.refreshToken;
        if (token) {
            //xoa refresh token
            await Session.deleteOne({ refreshToken: token });
            //xoa cookie
            res.clearCookie('refreshToken')
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error("Loi khi goi signOut", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
};
//tao access token moi bang refresh token
export const refreshToken = async (req, res) => {
    try {
        //lay refreshToken tu cookie
        const token = req.cookies?.refreshToken;
        if(!token){
            return res.status(401).json({message: 'Token khong ton tai'});
        }
        //so voi refreshToken trong db
        const session = await Session.findOne({refreshToken: token});
        if(!session){
            return res.status(403).json({message: 'Token khong hop le'});
        }
        //kiem tra refreshToken co ton tai va chua het han
        if(session.expiresAt < new Date()){
            return res.status(403).json({message: 'Token da het han'});
        }
        //tao accessToken moi
        const accessToken = jwt.sign({userId: session.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        //return 
        return res.status(200).json({accessToken});
    } catch (error) {
        console.error("Loi khi goi refreshToken", error);
        return res.status(500).json({ message: "Loi he thong" });
    }
}
