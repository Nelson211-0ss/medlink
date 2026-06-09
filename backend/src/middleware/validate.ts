import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

type Schema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/** Validate request parts against zod schemas; replaces parsed values. */
export const validate =
  (schema: Schema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) Object.assign(req.query, schema.query.parse(req.query));
      if (schema.params) Object.assign(req.params, schema.params.parse(req.params));
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new ValidationError('Validation failed', err.flatten().fieldErrors),
        );
      }
      next(err);
    }
  };
