/**
 * Wrapper for sql like databases
 */

import type { TypeCheck } from '@sinclair/typebox/compiler'
import { Database } from 'bun:sqlite'
import { Type, type Static } from '@sinclair/typebox'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { ENV } from '@/constants'

const log = console.log
const env = process.env

log('SQIMO')
const environment = ENV
log('NODE_ENV', environment)
mkdirSync(join(process.cwd(), `.${environment}`), { recursive: true })

const getTypeOfKey = (value: string) => {
	if (typeof value === 'string') {
		return 'TEXT'
	}

	if (Number.isInteger(value)) {
		return 'INTEGER'
	}

	if (typeof value === 'number') {
		return 'REAL'
	}
}

export class SqimoDb {
	connection_string: string
	collections: any[] = []
	database: Database

	constructor(connection_string: string = ':memory:') {
		this.connection_string = connection_string
		this.database = new Database(connection_string)
		log(process.cwd())
	}

	async connect() {
		log('🟡 [index:connect] This will be used when drivers will be implemented and connection will be async')
	}

	async collectionExists(name: string) {
		const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`
		const result = this.database.query(sql).get()

		return result ? true : false
	}

	/**
	 * Direct query to database without wrapper
	 * @param query - query string
	 */
	async $(query: any) {
		return this.database.query(query).all()
	}

	async listCollections() {
		// List all collections
		const collection_names = this.database.query('SELECT name FROM sqlite_master WHERE type="table"').all() as any[]
		const collections: SqimoCollection[] = []

		for (const collection_table of collection_names) {
			const collection = new SqimoCollection(this, collection_table.name)
			collections.push(collection)
		}

		return collections
	}

	// async getCollectionByName(name: string)
	async getCollection(name: string) {
		if (!await this.collectionExists(name)) {
			await this.createCollection(name)
		}
		const collection = new SqimoCollection(this, name)

		return collection
	}

	/**
     * @fields - object with fields ar typebox object
     */
	async createCollection(name: string, fields: any = {}) {
		const query = `CREATE TABLE IF NOT EXISTS ${name} (_id TEXT PRIMARY KEY)`
		await this.database.exec(query)
		const collection = new SqimoCollection(this, name)

		return collection
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
	fields?: any
	private _db: SqimoDb

	constructor(db: any, name: string, fields: any[] = []) {
		this.name = name
		this.fields = fields
		this._db = db
		// check if table exists
		const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`
		const result = this._db?.database.query(sql).get()

		if (!result) {
			this._db?.createCollection(name)
		}
	}

	async getFields(collection: string) {
		const fields = await this._db.$(`PRAGMA table_info(${collection})`)

		return fields.map((field: any) => field.type)
	}

	async createField(name: string, options: any = {}, value?: any) {
		options.type ??= 'TEXT'
		options.default ??= null
		options.is_optional ??= true
		options.is_unique ??= false
		options.is_index ??= false
		options.is_primary ??= false

		if (options.is_primary) {
			options.is_unique = true
		}

		if (options.is_unique) {
			options.is_index = true
		}

		const sql = `
            ALTER TABLE ${this.name} 
            ADD COLUMN ${name} ${options.type} 
            ${options.is_optional ? 'NULL' : 'NOT NULL'} 
            ${options.default ? `DEFAULT ${options.default}` : ''} 
            ${options.is_unique ? 'UNIQUE' : ''} 
            ${options.is_index ? 'INDEX' : ''} 
            ${options.is_primary ? 'PRIMARY KEY' : ''}
        `

		// log(sql.trim())

		await this._db?.database.exec(sql)
	}

	async fieldExists(name: string) {
		const sql = `PRAGMA table_info(${this.name})`
		const fields = await this._db.$(sql)
		const field = fields.find((field: any) => field.name === name)
		const result = field ? true : false

		return result
	}

	async find(query: object = {}) {
		// Find documents matching query
		const sql = `SELECT * FROM ${this.name}`
		const result = await this._db.$(sql)

		return result
	}

	async findOne(query: object = {}) {
		// Find single document
	}

	async insertOne(doc: any) {
		for (const key in doc) {
			if (!await this.fieldExists(key)) {
				await this.createField(key, { type: getTypeOfKey(doc[key]) })
			}
		}
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

export class SqimoField {
	name: string
	type: string
	default: any
	is_optional: boolean
	is_unique: boolean

	constructor(name: string, options: any = {}) {
		this.name = name
		this.type = options.type || 'TEXT'
		this.default = options.default || null
		this.is_optional = options.is_optional || false
		this.is_unique = options.is_unique || false
	}
}

export class SqimoDoc {}

const db = new SqimoDb()
await db.connect()
// log('createCollection')
// const collection = await db.createCollection('users')
// log(collection.name)
// log('getCollection')
const usersCollection = await db.getCollection('users')
// log('collectionExists users', await db.collectionExists('users'))
// log('getCollection users52', await db.getCollection('users52'))
// log('collectionExists users52', await db.collectionExists('users52'))
//log(collection2.name)
// db.createCollection('users', Type.Object({}))
usersCollection.insertOne({ name: 'John Doe', age: 25, id: 3455.328 })
const users = await usersCollection.find()

log(users)