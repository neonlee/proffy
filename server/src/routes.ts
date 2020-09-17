import express from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionController from './controllers/ConnectionController';
const routes = express.Router();

const ClassesControllers = new ClassesController();
const connectionsController = new ConnectionController();

routes.get('/classes', ClassesControllers.index);
routes.post('/classes', ClassesControllers.create);

routes.post('/connections', connectionsController.create);
routes.get('/connection', connectionsController.index)

export default routes;