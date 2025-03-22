/**
 * Wrapper for sql like databases
 */

import type { TypeCheck } from '@sinclair/typebox/compiler'
import { Database } from 'bun:sqlite'
import { Type, type Static } from '@sinclair/typebox'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { ENV } from '@/constants'
import type { info } from 'node:console'
import { Bungalow } from '@/lib'
import { SqimoUtils } from '@/lib'
const log = console.log

const b = new Bungalow('Sqimo')
b.log('SQIMO')

const environment = ENV
mkdirSync(join(process.cwd(), `.${environment}`), { recursive: true })

const escapeValues = (doc: any = {}) => {
	const escaped = Object.values(doc).map((value: any) => typeof value === 'string' ? `"${value}"` : value).join(', ')

	return escaped
}

export class SqimoDb {
	connection_string: string
	collections: any[] = []
	database: Database

	constructor(connection_string: string = ':memory:') {
		this.connection_string = connection_string
		this.database = new Database(connection_string)
	}

	async generateId() {
		const id = `${Math.random().toString(36).slice(2)}_${ENV[0]}`

		return id
	}

	async connect() {
		b.log('index:connect This will be used when drivers will be implemented and connection will be async')
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
	is_initialized: boolean | Promise<boolean> = false
	private _db: SqimoDb
	constructor(db: SqimoDb, name: string, fields: any[] = []) {
		this.name = name
		this.fields = fields
		this._db = db
		this.init(name)
	}

	async init(name: string) {
		// check if table exists
		const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`
		const result = this._db?.database.query(sql).get()

		if (!result) {
			await this._db?.createCollection(name)
		}

		this.is_initialized = true
	}

	async getFields() {
		await this.is_initialized

		const fields = await this._db.$(`PRAGMA table_info(${this.name})`)

		const sqimoFieldsls = fields.map((field: any) => {
			const _field = new SqimoField(
				this,
				field.name,
				{
					type: field.type,
				}
			)

			return _field
		})

		return sqimoFieldsls
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

	async find(query: any = {}) {
		const sql = `SELECT * FROM ${this.name}`
		const result = await this._db.$(sql)

		return result
	}

	async findOne(query: object = {}) {
		// Find single document
	}

	async insertOne(doc: any = {}) {
		for (const field_name in doc) {
			if (!await this.fieldExists(field_name)) {
				const field = await this.createField(
					field_name,
					{ type: SqimoUtils.getFieldType(doc[field_name]) }
				)
			}
		}
		const sql_object = [
			`INSERT INTO ${this.name} (`,
			Object.keys(doc).join(', '),
			') VALUES (',
			escapeValues(doc),
			')'
		]
		const sql_string = sql_object.join('')
		// console.log(sql_string
		const result = await this._db.$(sql_string)
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
	is_primary: boolean
	is_index: boolean

	constructor(collection: SqimoCollection,  name: string, options: any = {}) {
		this.name = name
		this.type = options.type || 'TEXT'
		this.default = options.default || null
		this.is_optional = options.is_optional || false
		this.is_unique = options.is_unique || false
		this.is_primary = options.is_primary || false
		this.is_index = options.is_index || false
	}

	async create() {
		// Create field

	}
}

export class SqimoDoc {}

const db = new SqimoDb()
await db.connect()

const usersCollection = await db.getCollection('users')
const posts = await db.getCollection('posts')
const user =  {
	name: 'John Doe',
	age: 25,
	uid: 3455.328
}

const userDoc = await usersCollection.insertOne(user)
const users = await usersCollection.find()
log(users)

log('name', SqimoUtils.getFieldType(user.name))
log('age', SqimoUtils.getFieldType(user.age))
log('uid', SqimoUtils.getFieldType(user.uid))

// log(await usersCollection.getFields())
// log((await db.listCollections()).map((collection) => collection.name))
// log(await usersCollection.getFields())