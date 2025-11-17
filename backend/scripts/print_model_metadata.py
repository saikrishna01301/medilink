from db.base import Base  # requires PYTHONPATH pointing at backend/app

for table_name, table in Base.metadata.tables.items():
    print(f"\nTable: {table_name}")
    for column in table.columns:
        default = column.default.arg if column.default is not None else None
        print(
            f"  {column.name}: {column.type}, pk={column.primary_key}, nullable={column.nullable}, default={default}"
        )
    for fk in table.foreign_keys:
        print(f"  ForeignKey: {fk}")
