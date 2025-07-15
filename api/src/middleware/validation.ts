import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

export const validateQuery = (schema: z.ZodSchema) => {
  return createMiddleware(async (c, next) => {
    try {
      const query = c.req.query()
      const validatedQuery = schema.parse(query)
      c.set('validatedQuery', validatedQuery)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(400, { 
          message: 'Invalid query parameters',
          cause: error.errors 
        })
      }
      throw error
    }
  })
}

export const validateBody = (schema: z.ZodSchema) => {
  return createMiddleware(async (c, next) => {
    try {
      const body = await c.req.json()
      const validatedBody = schema.parse(body)
      c.set('validatedBody', validatedBody)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(400, { 
          message: 'Invalid request body',
          cause: error.errors 
        })
      }
      throw error
    }
  })
}

export const validateParams = (schema: z.ZodSchema) => {
  return createMiddleware(async (c, next) => {
    try {
      const params = c.req.param()
      const validatedParams = schema.parse(params)
      c.set('validatedParams', validatedParams)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(400, { 
          message: 'Invalid URL parameters',
          cause: error.errors 
        })
      }
      throw error
    }
  })
}

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
}).refine(data => data.page > 0, {
  message: "Page must be greater than 0",
  path: ["page"]
}).refine(data => data.limit > 0 && data.limit <= 100, {
  message: "Limit must be between 1 and 100",
  path: ["limit"]
})

export const validationMiddleware = {
  query: validateQuery,
  body: validateBody,
  params: validateParams,
  pagination: validateQuery(paginationSchema)
}