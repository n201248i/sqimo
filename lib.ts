import fs from 'node:fs'
import { Type } from '@sinclair/typebox'

export class Bungalow {
	name: string

	constructor(name: string) {
		this.name = name
	}

	log(...args: any[]) {
		console.log(`👹 ${this.name}:`, ...args)
	}

	info(...args: any[]) {
		console.info(`🔵 ${this.name}`, ...args)
	}
}

export class SqimoUtils {
	static makeDirSync(path: string) {
		if (path.includes(process.cwd())) {
			console.log('🔴 Looks like you trying to dynamicaly create directory in CWD which not better idia.')
		}

		return fs.mkdirSync(path, { recursive: true })
	}

	static toTypeBox(obj: object) {
		return obj
	}

	static env(): any {
		const env = process.env.NODE_ENV || 'development'

		return env
	}

	/**
	 * Generate random id
	 * TODO: add library to generate random id
	 */
	static id() {
		const env = SqimoUtils.env()
		const env_type = env[0]

		return `${Math.random().toString(36).slice(2)}_${env_type}`
	}

	static getFieldType(value: any) {
		if (value + '' === value) {
			return 'TEXT'
		}

		if(Number.isInteger(value)) {
			return 'INTEGER'
		}

		return 'REAL'
	}
}

// console.log(SqimoUtils.id())

// console.log(SqimoUtils.toTypeBox(
// 	{
// 		name: { type: 'TEXT'}
// 	}
// ))