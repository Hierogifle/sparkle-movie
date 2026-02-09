from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("check-spark-again")
    .master("local[*]")
    .config("spark.driver.memory", "4g")
    .getOrCreate()
)

df = spark.range(0, 1_000_000)  # 1 million, pas 10
print(df.count())

spark.stop()
