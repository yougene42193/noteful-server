'use strict';
const path = require('path');
const express = require('express');
const xss = require('xss');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = (folder) => ({
  id: folder.id,
  folder_name: xss(folder.folder_name),
});

foldersRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    FoldersService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const{ folder_name } = req.body;
    const newFolder = { folder_name };
    if(!newFolder) {
      return res.status(400).json({
        error: { message: 'Missing folder name in request body' }
      });
    }

    FoldersService.insertFolder(
      req.app.get('db'),
      newFolder
    )
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/:folder_id')
  .all((req, res, next) => {
    const { folder_id } = req.params;
    FoldersService.getFolderById(
      req.app.get('db'),
      folder_id
    )
      .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: 'Folder doesn\'t exist'}
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
    FoldersService.deleteFolder(
      req.app.get('db'),
      req.params.folder_id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { newFolder } = req.body;
    if(!newFolder) {
      return res.status(400).json({
        error: {
          message: 'Request must contain folder name'
        }
      });
    }
    FoldersService.updateFolder(
      req.app.get('db'),
      req.params.folder_id,
      name
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })

module.exports = foldersRouter;