<?php
/**
 * Pimcore
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.pimcore.org/license
 *
 * @category   Pimcore
 * @package    Document
 * @copyright  Copyright (c) 2009-2010 elements.at New Media Solutions GmbH (http://www.elements.at)
 * @license    http://www.pimcore.org/license     New BSD License
 */

class Document_Hardlink_Wrapper_Page extends Document_Page implements Document_Hardlink_Wrapper_Interface {

    // OVERWRITTEN METHODS
    public function save() {
        $this->raiseHardlinkError();
    }

    public function update() {
        $this->raiseHardlinkError();
    }

    public function delete() {
        $this->raiseHardlinkError();
    }

    public function getProperties() {

        if($this->properties == null) {

            $directProperties = $this->getResource()->getProperties(false,true);
            $inheritedProperties = $this->getResource()->getProperties(true);
            $hardLinkSourceProperties = array();

            if($this->getHardLinkSource()->getPropertiesFromSource()) {
                $hardLinkSourceProperties = $this->getHardLinkSource()->getProperties();
                foreach ($hardLinkSourceProperties as &$prop) {
                    $prop = clone $prop;
                    $prop->setInherited(true);
                }
            }

            $properties = array_merge($inheritedProperties, $hardLinkSourceProperties, $directProperties);
            $this->setProperties($properties);
        }

        return $this->properties;
    }



    /**
     * @var Document_Hardlink
     */
    protected $hardLinkSource;

    /**
     * @throws Exception
     * @return void
     */
    protected function raiseHardlinkError () {
        throw new Exception("Method no supported by hardlinked documents");
    }

    /**
     * @param \Document_Hardlink $hardLinkSource
     */
    public function setHardLinkSource($hardLinkSource)
    {
        $this->hardLinkSource = $hardLinkSource;
    }

    /**
     * @return \Document_Hardlink
     */
    public function getHardLinkSource()
    {
        return $this->hardLinkSource;
    }
}
