<?php


class vwklhtmltablesTables_Tables_Model_Tables extends vwklhtmltablesTables_Core_BaseModel
{
    /**
     * Returns table column by index.
     * @param int $id Table id
     * @param int $index Column index
     * @return stdClass|null
     */
    public function getColumn($id, $index)
    {
        $query = $this->getColumnQuery($id)
            ->where($this->getField('columns', 'index'), '=', (int)$index);

        $column = $this->db->get_row($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }

        return $column;
    }

    /**
     * Returns the array of the NOT extended tables
     *
     * @return null|array
     */
    public function getList()
    {
        $query = $this->getQueryBuilder()->select('*')
            ->from($this->db->prefix . 'vwklhtmltables_tbl_tables')
            ->orderBy('id')
            ->order('DESC');

        return $this->db->get_results($query->build());
    }

    /**
     * Returns an array of the table columns.
     * @param int $id Table id
     * @return string[]
     */
    public function getColumns($id)
    {
        $query = $this->getColumnQuery($id)
            ->orderBy($this->getField('columns', 'index'));

        $columns = $this->db->get_results($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }

        if (count($columns) > 0) {
            foreach ($columns as $index => $column) {
                $columns[$index] = $column->title;
            }
        }

        return $columns;
    }

    /**
     * Adds a new column to the table.
     * @param int $id Table id
     * @param array|object $column Column data (index, title)
     */
    public function addColumn($id, $column)
    {
        if (!is_array($column) && !is_object($column)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Second parameter must be an array or an instance of the stdClass, %s given.',
                    gettype($column)
                )
            );
        }

        $column = (array)$column;
        if (!array_key_exists('table_id', $column)) {
            $column['table_id'] = (int)$id;
        }

        foreach ((array)$column as $key => $value) {
            unset($column[$key]);
            $column[$this->getField('columns', $key)] = $value;
        }

        $query = $this->getQueryBuilder()
            ->insertInto($this->getTable('columns'))
            ->fields(array_keys($column))
            ->values(array_values($column));

        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }
    }

    /**
     * Updates column data.
     * @param int $id Table id
     * @param int $index Column index
     * @param array|object $column Column data
     */
    public function setColumn($id, $index, $column)
    {
        if (!is_array($column) && !is_object($column)) {
            throw new InvalidArgumentException(
                sprintf(
                    'Second parameter must be an array or an instance of the stdClass, %s given.',
                    gettype($column)
                )
            );
        }

        $column = (array)$column;

        $query = $this->getQueryBuilder()
            ->update($this->getTable('columns'))
            ->fields(array_keys($column))
            ->values(array_values($column))
            ->where($this->getField('columns', 'table_id'), '=', (int)$id)
            ->andWhere($this->getField('columns', 'index'), '=', (int)$index);

        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }
    }

    /**
     * Removes old columns and set a net columns for the table.
     * @param int $id Table id
     * @param array $columns An array of the columns with data.
     */
    public function setColumns($id, array $columns)
    {
        if (count($columns) === 0) {
            throw new InvalidArgumentException('Too few columns.');
        }

        try {
            $this->removeColumns($id);

            foreach ($columns as $index => $column) {
                if (is_string($column)) {
                    $column = array('title' => $column);
                }

                $column = (array)$column;

                if (is_array($column) && !array_key_exists('index', $column)) {
                    $column['index'] = $index;
                }

                $this->addColumn($id, (array)$column);
            }
        } catch (Exception $e) {
            throw new RuntimeException(
                sprintf(
                    'Failed to set columns: %s',
                    $e->getMessage()
                )
            );
        }
    }

    /**
     * Removes table columns.
     * @param int $id Table id
     */
    public function removeColumns($id)
    {
        $query = $this->getQueryBuilder()
            ->deleteFrom($this->getTable('columns'))
            ->where('table_id', '=', (int)$id);

        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }
    }

    /**
     * Adds a row to the table.
     * @param int $id Table id
     * @param array $data An array of the row data
     * @return int
     */
    public function addRow($id, array $data)
    {
        
        if (isset($data['cells'])) {
            foreach ($data['cells'] as &$cell) {
                if (isset($cell['comment'])) {
                    $cell['comment'] = htmlspecialchars((string)$cell['comment'], ENT_QUOTES);
                }
                $cell['data'] = htmlspecialchars((string)$cell['data'], ENT_QUOTES);
            }
        }

        $query = $this->getQueryBuilder()
            ->insertInto($this->getTable('rows'))
            ->fields(
                $this->getField('rows', 'table_id'),
                $this->getField('rows', 'data')
            )
            ->values((int)$id, serialize($data));

        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }

        return $this->db->insert_id;
    }

    /**
     * Returns all table rows
     * @param int $id Table id
     * @return array
     */
    public function getRows($id)
    {
        $query = $this->getQueryBuilder()
            ->select($this->getField('rows', 'data'))
            ->from($this->getTable('rows'))
            ->where('table_id', '=', (int)$id)
            ->orderBy($this->getField('rows', 'id'));

        $rows = $this->db->get_results($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }

        if (count($rows) > 0) {
            foreach ($rows as $index => $row) {
                $rows[$index] = unserialize($row->data);
            }
        }

        foreach ($rows as &$row) {
            if (!empty($row['cells'])) {
                foreach ($row['cells'] as &$cell) {
                    if (isset($cell['comment'])) {
                        $cell['comment'] = htmlspecialchars_decode($cell['comment'], ENT_QUOTES);
                    }
                    $cell['data'] = htmlspecialchars_decode($cell['data'], ENT_QUOTES);
                }
            } else {
                $row['cells'] = array();
            }
        }

        return $rows;
    }

    /**
     * Sets the rows for the table
     * @param int $id Table id
     * @param array $rows An array of the rows
     */
    public function setRows($id, array $rows)
    {
        if (count($rows) === 0) {
            throw new InvalidArgumentException('Too few rows.');
        }

        try {
            $this->removeRows($id);

            foreach ($rows as $row) {
                $this->addRow($id, $row);
            }
        } catch (Exception $e) {
            throw new RuntimeException(
                sprintf('Failed to set rows: %s', $e->getMessage())
            );
        }
    }

    /**
     * Removes all table rows.
     * @param int $id Table id
     */
    public function removeRows($id)
    {
        $query = $this->getQueryBuilder()
            ->deleteFrom($this->getTable('rows'))
            ->where($this->getField('rows', 'table_id'), '=', (int)$id);


        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }
    }

    public function setMeta($id, array $meta)
    {
        $query = $this->getQueryBuilder()
            ->update($this->getTable())
            ->where('id', '=', (int)$id)
            ->set(array('meta' => serialize($meta)));


        $this->db->query($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }
    }

    /**
     * Callback for vwklhtmltablesTables_Tables_Model_Tables::get()
     * @see vwklhtmltablesTables_Tables_Model_Tables::get()
     * @param object|null $table Table data
     * @return object|null
     */
    public function onTablesGet($table)
    {
        // This method load twice all rows in backend second call go via ajax.
        // Need to fix.
        if (null === $table) {
            return $table;
        }

		$table->view_id = $table->id . '_' . mt_rand(1, 99999);
        $table->columns = $this->getColumns($table->id);
        $table->rows = $this->getRows($table->id);
        $table->settings = unserialize(htmlspecialchars_decode($table->settings));

        // rev 41
        if (property_exists($table, 'meta')) {
            $table->meta = unserialize(htmlspecialchars_decode($table->meta));
        }

        return $table;
    }

    /**
     * Filter for vwklhtmltablesTables_Tables_Model_Tables::getAll()
     * @see vwklhtmltablesTables_Tables_Model_Tables::getAll()
     * @param object[] $tables An array of the tables data
     * @return object[]
     */
    public function onTablesGetAll($tables)
    {
        if (null === $tables || (is_array($tables) && count($tables) === 0)) {
            return $tables;
        }

        return array_map(array($this, 'onTablesGet'), $tables);
    }

    /**
     * {@inheritdoc}
     *
     * Adds filters for the methods get() and getAll().
     */
    public function onInstanceReady()
    {
        parent::onInstanceReady();

        $dispatcher = $this->environment->getDispatcher();


        $dispatcher->on('tables_get', array($this, 'onTablesGet'));
        // No reason to fetch all data from all tables when we need only tables list
        // $dispatcher->on('tables_get_all', array($this, 'onTablesGetAll'));
    }

    protected function getColumnQuery($id)
    {
        return $this->getQueryBuilder()
            ->select($this->getField('columns', 'title'))
            ->from($this->getTable('columns'))
            ->where('table_id', '=', (int)$id);
    }

    public function getSettings($id)
    {
        $query = $this->getQueryBuilder()
            ->select($this->getField('tables', 'settings'))
            ->from($this->getTable('tables'))
            ->where('id', '=', (int)$id);

        $result = $this->db->get_results($query->build());

        if ($this->db->last_error) {
            throw new RuntimeException($this->db->last_error);
        }

        return $result;
    }
}