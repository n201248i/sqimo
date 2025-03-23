/**
 * Wrapper for sql like databases
 */

import { Database } from 'bun:sqlite'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { ENV } from '@/src/constants'
import { Bungalow } from '@/src/lib'
import { SqimoUtils } from '@/src/lib'
import { mongoToSql } from '@/src/mongo_to_sql'
const log = console.log

const environment = ENV
const db_dir = join(process.cwd(), `.sqimo/.${environment}`)

mkdirSync(db_dir, { recursive: true })

const escapeValues = (doc: any = {}) => {
	const escaped = Object.values(doc).map((value: any) => typeof value === 'string' ? `"${value}"` : value).join(', ')

	return escaped
}

export class SqimoDb {
	connection_string: string
	collections: any[] = []
	database: Database
	is_initialized: boolean | Promise<boolean> = false

	constructor(connection_string: string = ':memory:') {
		this.connection_string = connection_string
		this.database = new Database(connection_string)
	}

	async init() {
		this.is_initialized = true
	}

	async generateId() {
		await this.is_initialized
		const id = `${Math.random().toString(36).slice(2)}_${ENV[0]}`

		return id
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
		try {
			return this.database.query(query).all()
		} catch (error) {
			console.error('SQL error:', query)

			return error
		}
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
		await this.is_initialized

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
		await this.is_initialized

		const query = `CREATE TABLE IF NOT EXISTS ${name} (_id TEXT PRIMARY KEY)`

		await this.database.exec(query)
		const collection = new SqimoCollection(this, name)

		return collection
	}

	async dropCollection(name: string) {
		await this.is_initialized
		const query = `DROP TABLE IF EXISTS ${name}`

		await this.database.exec(query)
	}

	async close() {
		// Close connection
		await this.is_initialized
		this.database.close()
	}
}

export class SqimoCollection {
	name: string
	fields?: any[]
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

		const fields: any = await this._db.$(`PRAGMA table_info(${this.name})`)

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
		await this.is_initialized
		const sql = `PRAGMA table_info(${this.name})`
		const fields: any = await this._db.$(sql)
		const field = fields.find((field: any) => field.name === name)
		const result = field ? true : false

		return result
	}

	async ensureIndex(fields: string[], options: any = {}) {
		await this.is_initialized

		// Set default options
		options.unique ??= false

		// Create index name from fields
		const index_name = `idx_${this.name}_${fields.join('_')}`

		// Build the CREATE INDEX statement
		const sql = `
			CREATE ${options.unique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS ${index_name} 
					ON ${this.name} (${fields.join(', ')})
			`

		// Execute the index creation
		await this._db.database.exec(sql)

		return index_name
	}

	async showIndexes() {
		await this.is_initialized
		const sql = `PRAGMA index_list(${this.name})`
		const indexes = await this._db.$(sql)

		return indexes
	}

	async find(query: any = {}, options: any = {}) {
		await this.is_initialized

		// Limit is to 100 by default. To force developers implent pagination
		options.limit ??= 100
		options.skip ??= 0
		options.sort ??= { _id: 1 }

		// Build the SQL query
		let sql = `SELECT * FROM ${this.name} ${mongoToSql(query)}`

		// Add ORDER BY clause
		const orderBy = Object.entries(options.sort)
			.map(([field, direction]) => `${field} ${(direction as number) === 1 ? 'ASC' : 'DESC'}`)
			.join(', ')

		if (orderBy) {
			sql += ` ORDER BY ${orderBy}`
		}

		// Add LIMIT and OFFSET
		sql += ` LIMIT ${options.limit} OFFSET ${options.skip}`

		const result = await this._db.$(sql)

		return result
	}

	async findOne(query: any = {}) {
		await this.is_initialized
		const result: any = await this.find(query, { limit: 1 })
		const doc = result[0] || null
		return doc
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

const db = new SqimoDb()

const usersCollection = await db.getCollection('users')
const user =  {
	name: 'John Doe',
	age: 25,
	uid: 3455.328
}

const userDoc = await usersCollection.insertOne(user)
const users = await usersCollection.find({age: { $gt: 20 }})

usersCollection.ensureIndex(['name', 'age'], { unique: true })
log(await usersCollection.showIndexes())

log(users)

// log(await usersCollection.getFields())
// log((await db.listCollections()).map((collection) => collection.name))
// log(await usersCollection.getFields())