import { Router } from 'express';
import routes from '../index.js';

const v1 = Router();
v1.use('/', routes);

export default v1;
