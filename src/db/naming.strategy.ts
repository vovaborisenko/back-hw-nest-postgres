import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class CustomNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  // Имя для foreign key constraint
  foreignKeyName(
    tableOrName: string,
    columnNames: string[],
    referencedTablePath: string,
  ): string {
    const tableName = this.getTableName(tableOrName);
    const referencedTableName = this.getTableName(referencedTablePath);

    // Пример: "fk_users_recovery_userId" или "fk_recovery_user_id"
    const columns = columnNames.join('_');
    return `fk_${tableName}_${referencedTableName}_${columns}`;
  }

  // Имя для primary key constraint
  primaryKeyName(tableOrName: string, columnNames: string[]): string {
    const tableName = this.getTableName(tableOrName);
    const columns = columnNames.join('_');
    return `pk_${tableName}_${columns}`;
  }

  // Имя для unique constraint
  uniqueConstraintName(tableOrName: string, columnNames: string[]): string {
    const tableName = this.getTableName(tableOrName);
    const columns = columnNames.join('_');
    return `uq_${tableName}_${columns}`;
  }

  // Имя для index
  indexName(tableOrName: string, columnNames: string[]): string {
    const tableName = this.getTableName(tableOrName);
    const columns = columnNames.join('_');
    return `idx_${tableName}_${columns}`;
  }
}
