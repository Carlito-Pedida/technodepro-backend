import { RequestHandler } from "express";
import { User } from "../models/user";
import { Posts } from "../models/posts";
import {
  comparePasswords,
  hashPassword,
  signUserToken,
  verifyUser
} from "../services/auth";

export const getAllUsers: RequestHandler = async (req, res, next) => {
  let users = await User.findAll({
    attributes: { exclude: ["password"] },
    include: [{ all: true, nested: true }]
  });
  res.status(200).json(users);
};

export const createUser: RequestHandler = async (req, res, next) => {
  let newUser: User = req.body;
  if (newUser.username && newUser.password) {
    let hashedPassword = await hashPassword(newUser.password);
    newUser.password = hashedPassword;
    let created = await User.create(newUser);
    res.status(201).json({
      user_id: created.userId,
      username: created.username,
      first_name: created.first_name,
      last_name: created.last_name,
      email: created.email,
      city: created.city,
      state: created.state,
      zipcode: created.zipcode
    });
  } else {
    res.status(400).send("Please complete all required fields");
  }
};

export const loginUser: RequestHandler = async (req, res, next) => {
  // Look up user by their username
  let existingUser: User | null = await User.findOne({
    where: { username: req.body.username }
  });

  // If user exists, check that password matches
  if (existingUser) {
    let passwordsMatch = await comparePasswords(
      req.body.password,
      existingUser.password
    );

    // If passwords match, create a JWT
    if (passwordsMatch) {
      let token = await signUserToken(existingUser);
      res.status(200).json({ token });
    } else {
      res.status(401).json("Invalid password");
    }
  } else {
    res.status(401).json("Invalid username");
  }
};

export const getUserById: RequestHandler = async (req, res, next) => {
  let userId = req.params.userId;
  let getUser = await User.findByPk(userId);
  res.status(200).json(getUser);
};

export const getProfile: RequestHandler = async (req, res, next) => {
  let user: User | null = await verifyUser(req);

  let reqId = parseInt(req.params.id);

  if (user && user.userId === reqId) {
    let userId = req.params.userId;
    let getUser = await User.findByPk(userId);
    res.status(200).json(getUser);
  } else {
  }
  res.status(401).json();
};

export const getOneUser: RequestHandler = async (req, res, next) => {
  let user: User | null = await verifyUser(req);

  if (user) {
    res.status(200).json({
      userId: user.userId,
      username: user.username,
      password: user.password,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      city: user.city,
      state: user.state,
      zipcode: user.zipcode,
      userImg: user.userImg,
      createdAt: user.createdAt
    });
  } else {
  }
  res.status(401).json();
};

export const getUserPosts: RequestHandler = async (req, res, next) => {
  let user: User | null = await verifyUser(req);

  if (user) {
    let posts = await User.findByPk(user.userId, {
      include: [{ all: true, nested: true }]
    });
    res.status(200).json(posts);
  } else {
    res.status(404).json();
  }
};

export const getPostByUser: RequestHandler = async (req, res, next) => {
  let user: User | null = await verifyUser(req);

  if (!user) {
    return res.status(403).send();
  }
  let postItem = req.params.userId;
  let posts = await Posts.findByPk(postItem);

  res.status(200).json(posts);
};

export const getUserPostById: RequestHandler = async (req, res, next) => {
  let user: User | null = await verifyUser(req);

  if (user) {
    let postId = req.params.postId;
    let found = await Posts.findByPk(postId);

    found && user.userId;

    if (found) {
      await Posts.findOne({
        where: { userId: postId }
      });
      res.status(200).json(found);
    }
  } else {
    res.status(404).json();
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  const user: User | null = await verifyUser(req);

  if (user) {
    let userId = req.params.userId;
    let updatedProfile: User = req.body;
    if (updatedProfile.username && updatedProfile.password) {
      let hashedPassword = await hashPassword(updatedProfile.password);
      updatedProfile.password = hashedPassword;

      updatedProfile.userId = user.userId;

      let userFound = await User.findByPk(userId);

      userFound &&
        userFound.userId == updatedProfile.userId &&
        updatedProfile.email &&
        updatedProfile.first_name &&
        updatedProfile.last_name &&
        updatedProfile.city &&
        updatedProfile.state &&
        updatedProfile.zipcode &&
        updatedProfile.userImg;
      {
        await User.update(updatedProfile, {
          where: { userId: parseInt(userId) }
        });
      }
      res.status(200).json(updatedProfile);
    }
  } else {
    res.status(400).json();
  }
};
