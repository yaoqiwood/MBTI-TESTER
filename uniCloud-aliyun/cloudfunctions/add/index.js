'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
	const collection = db.collection('unicloud-test')
	const { product } = event
	const res = await collection.add({ product })
	return res
};
