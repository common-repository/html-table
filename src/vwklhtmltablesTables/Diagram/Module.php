<?php

/**
 * Class vwklhtmltablesTables_Diagram_Module
 */
class vwklhtmltablesTables_Diagram_Module extends vwklhtmltablesTables_Core_BaseModule
{
    /**
     * {@inheritdoc}
     */
    public function onInit()
    {
        parent::onInit();

        $this->renderDiagramsSection();
    }

    /**
     * Renders the "Diagrams" tab.
     * @param \stdClass $table Current table
     */
    public function afterTabsRendered()
    {
        $twig = $this->getEnvironment()->getTwig();
        $twig->display('@diagram/partials/tab.twig', array());
    }

    /**
     * Renders the "Diagrams" tab content.
     * @param \stdClass $table Current table
     */
    public function afterTabsContentRendered($table)
    {
        $twig = $this->getEnvironment()->getTwig();
        $dispatcher = $this->getEnvironment()->getDispatcher();

        $twig->display(
            $dispatcher->apply(
                'diagram_tabs_content_template',
                array('@diagram/partials/tabContent.twig')
            ),
            $dispatcher->apply(
                'diagram_tabs_content_data',
                array(
                    array(
                        'table' => $table
                    )
                )
            )
        );
    }

    /**
     * Runs the callbacks after the table editor tabs rendered.
     */
    private function renderDiagramsSection()
    {
        $dispatcher = $this->getEnvironment()->getDispatcher();

        $dispatcher->on('tabs_rendered', array($this, 'afterTabsRendered'));
        $dispatcher->on(
			'tabs_content_rendered', 
			array($this, 'afterTabsContentRendered')
		);
    }
}