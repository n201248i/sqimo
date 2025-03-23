const $funcs: any = {
	$or: () => {},
	$and: () => {},
	$gt: (field_name:  string, value: number) => {
		return `${field_name} > ${value}`
	},
	$lt: (field_name:  string, value: number) => {
		return `${field_name} < ${value}`
	}
}

const escape = (value: any) => {
	if (typeof value === 'string') {
		return `'${value}'`
	}

	return value
}

export const mongoToSql = (mongo_style_query: any = {}) => {
	if (Object.keys(mongo_style_query).length === 0) {
		return ''
	}

	const sql_array = []

	   for (const field_name in mongo_style_query) {
		const field_value = mongo_style_query[field_name]

		if (field_value instanceof Object) {
			for (const $func in $funcs) {
				const is_fn_included = $func in field_value

				is_fn_included && sql_array.push(`(${$funcs[$func](field_name, field_value[$func])})`)
			}
		} else {
			sql_array.push(`${field_name} = ${escape(field_value)}`)
		}
	}
	const sql_string = 'WHERE ' + sql_array.join(' AND ')

	return sql_string
}