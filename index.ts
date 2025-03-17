/**
 * Wrapper for sql like databases
 */

import type { TypeCheck } from '@sinclair/typebox/compiler'
import { Database } from 'bun:sqlite'
import { Type, type Static } from '@sinclair/typebox'

const log = console.log
const env = process.env

log('SQIMO')
log(env.NODE_ENV)

const environment = env.NODE_ENV || 'development'
log(environment)

export class SqimoDb {
	connection_string: string
	collections: SqimoCollection[] = []
	database: any

	constructor(connection_string: string = ':memory:') {
		this.connection_string = connection_string
		this.database = new Database(connection_string)
	}

	async connect() {
		// Initialize connection
	}

	collection(name: string): SqimoCollection {
		return new SqimoCollection(name)
	}

	async listCollections() {
		// List all collections
	}

	async createCollection(name: string, fields: typeof Type.Object) {
		// Create new collection

	}

	async dropCollection(name: string) {
		// Drop collection
	}

	async close() {
		// Close connection
	}
}

export class SqimoCollection {
	name: string
	db?: SqimoDb | null

	constructor(name: string) {
		this.name = name
	}

	async setDb(db: SqimoDb) {
		this.db = db
	}

	async find(query: object = {}) {
		// Find documents matching query
	}

	async findOne(query: object = {}) {
		// Find single document
	}

	async insertOne(doc: object) {
		// Insert one document
	}

	async insertMany(docs: object[]) {
		// Insert multiple documents
	}

	async updateOne(filter: object, update: object) {
		// Update single document
	}

	async updateMany(filter: object, update: object) {
		// Update multiple documents
	}

	async deleteOne(filter: object) {
		// Delete single document
	}

	async deleteMany(filter: object) {
		// Delete multiple documents
	}

	async aggregate(pipeline: object[]) {
		// Perform aggregation
	}
}

export class SqimoField {}

export class SqimoDoc {}